// market.js — location curves + macro cycles (NO modules; exposes window.market)
(function () {
  'use strict';

  const locBase = {
    A: { appreciation: 0.035, vacancy: 0.04 },
    B: { appreciation: 0.025, vacancy: 0.06 },
    C: { appreciation: 0.010, vacancy: 0.10 },
  };

  function marketForTurn(turn /* 1..180 */) {
    // 7-year macro waves
    const cycle = Math.sin((turn / 12) * (Math.PI * 2 / 7)); // -1..1
    const macroBoost = 1 + 0.2 * cycle; // 0.8..1.2
    return { macroBoost };
  }

  function appreciationRate(location, turn) {
    const base = (locBase[location] && locBase[location].appreciation) ?? 0.02;
    const { macroBoost } = marketForTurn(turn);
    return base * macroBoost;
  }

  function vacancyRate(location, turn) {
    const base = (locBase[location] && locBase[location].vacancy) ?? 0.06;
    const { macroBoost } = marketForTurn(turn);
    // In downturns, vacancy worsens (inverse of macroBoost)
    return Math.min(0.25, Math.max(0, base * (2 - macroBoost)));
  }

  window.market = { marketForTurn, appreciationRate, vacancyRate };
})();
