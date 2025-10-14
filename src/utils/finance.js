// finance.js — all $/rate math in one place (NO modules; exposes window.finance)
(function () {
  'use strict';

  function mortgagePmt(principal, apr = 0.065, years = 30) {
    const n = years * 12, r = apr / 12;
    return r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  }

  // Annuals
  function grossRentAnnual(units, avgRent, lotFeesMonthly = 0) {
    return (units * avgRent + lotFeesMonthly) * 12;
  }

  function noiAnnual({ grossRent, vacancyRatePct = 5, expensesAnnual = {} }) {
    const vacancy = grossRent * (vacancyRatePct / 100);
    const totalExp = Object.values(expensesAnnual).reduce((a,b)=>a+(b||0), 0);
    return grossRent - vacancy - totalExp;
  }

  function debtServiceAnnual(loanAmount, apr = 0.065, years = 30, miAnnual = 0) {
    return mortgagePmt(loanAmount, apr, years) * 12 + (miAnnual || 0);
  }

  function dscr(noiAnn, debtAnn) {
    return debtAnn === 0 ? Infinity : (noiAnn / debtAnn);
  }

  function capRate(noiAnn, purchasePrice) {
    return purchasePrice === 0 ? 0 : (noiAnn / purchasePrice);
  }

  function grm(purchasePrice, grossRentAnn) {
    return grossRentAnn === 0 ? Infinity : (purchasePrice / grossRentAnn);
  }

  // Cash at close & simple ROI
  function cashAtClose({ downPayment, closingCosts }) {
    return (downPayment || 0) + (closingCosts || 0);
  }

  function year1Return({ appreciationAmt = 0, principalPaydown = 0, cashFlowAnn = 0 }) {
    return appreciationAmt + principalPaydown + cashFlowAnn;
  }

  function roiYear1(totalReturn, cashInvested) {
    return cashInvested === 0 ? 0 : (totalReturn / cashInvested);
  }

  // Translate inputs → metrics
  function evaluateDeal(input) {
    const {
      price, downPct = 0.20, loanAPR = 0.065, termYears = 30,
      units, avgRent, lotFeesMonthly = 0,
      vacancyRatePct = 5,
      expensesAnnual = {},              // {tax, ins, repairs, mgmt, water, sewer, trash, advertising, ...}
      closingCosts = 0,
      miAnnual = 0,
      appreciationRate = 0.03,
    } = input;

    const downPayment = Math.round(price * downPct);
    const loan = price - downPayment;

    const gross = grossRentAnnual(units, avgRent, lotFeesMonthly);
    const noi = noiAnnual({ grossRent: gross, vacancyRatePct, expensesAnnual });
    const debtAnn = debtServiceAnnual(loan, loanAPR, termYears, miAnnual);
    const monthlyNI = Math.round((noi - debtAnn) / 12);

    const dscrVal = dscr(noi, debtAnn);
    const cap = capRate(noi, price);
    const grmVal = grm(price, gross);

    const cashClose = cashAtClose({ downPayment, closingCosts });

    // rough principal paydown (approx; fine for MVP)
    const monthlyPI = mortgagePmt(loan, loanAPR, termYears);
    const interestApprox = loan * loanAPR; // simple year-1 interest estimate
    const principalPaydown = monthlyPI * 12 - interestApprox;

    const appreciationAmt = price * appreciationRate;
    const cashFlowAnn = (noi - debtAnn);

    const y1Return = year1Return({ appreciationAmt, principalPaydown, cashFlowAnn });
    const roi = roiYear1(y1Return, cashClose);

    return {
      downPayment, loan, gross, noi, debtAnn, monthlyNI,
      dscr: dscrVal, cap, grm: grmVal,
      cashAtClose: cashClose,
      y1Return, roi,
      appreciationAmt, principalPaydown, cashFlowAnn,
    };
  }

  window.finance = {
    mortgagePmt,
    grossRentAnnual,
    noiAnnual,
    debtServiceAnnual,
    dscr,
    capRate,
    grm,
    cashAtClose,
    year1Return,
    roiYear1,
    evaluateDeal,
  };
})();
