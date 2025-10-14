// credit.js — maps equity% → credit score (very rough curve)
(function () {
  'use strict';

  const credit = {
    creditFromEquityPct(pct) {
      if (pct >= 0.75) return 850;
      if (pct >= 0.50) return 780;
      if (pct >= 0.35) return 720;
      if (pct >= 0.20) return 660;
      if (pct >= 0.10) return 600;
      return 550;
    }
  };

  window.credit = credit;
})();
