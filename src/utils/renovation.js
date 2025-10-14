// renovation.js — value/rent effects of renovation spend (NO modules; exposes window.renovation)
(function () {
  'use strict';

  // Your rule: C (ghetto) $1 -> $0; B -> $2; A -> $3
  const RENOVATION_MULT = { A: 3, B: 2, C: 0 };

  function valueGainFromRenovation(location, spend) {
    return spend * (RENOVATION_MULT[location] ?? 1);
  }

  // Optional: modest rent lift from value creation (very rough)
  function rentLiftFromRenovation(spend, factor = 0.004) {
    // $10k spend ~ $40/mo extra rent by default
    return Math.round(spend * factor);
  }

  window.renovation = {
    valueGainFromRenovation,
    rentLiftFromRenovation,
  };
})();
