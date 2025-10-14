// generator.js — random property listings (NO modules; exposes window.generateProperty)
(function () {
  'use strict';

  const CLASSES = {
    A: { pricePerUnit: [180000, 280000], rentPerUnit: [1800, 2600], expRate: 0.35, mult: 1.0 },
    B: { pricePerUnit: [120000, 200000], rentPerUnit: [1200, 1800], expRate: 0.40, mult: 0.66 },
    C: { pricePerUnit: [ 60000, 120000], rentPerUnit: [ 700, 1200], expRate: 0.45, mult: 0.45 },
  };

  const ASSETS = [
    { name: 'Mobile Home', units:[1,1] },
    { name: 'SFH',         units:[1,1] },
    { name: 'Duplex',      units:[2,2] },
    { name: 'Triplex',     units:[3,3] },
    { name: 'Quadplex',    units:[4,4] },
    { name: '5-Unit',      units:[5,5] },
    { name: '10-Unit',     units:[10,10] },
    { name: '25-Unit',     units:[25,25] },
    { name: '50-Unit',     units:[50,50] },
    { name: '100-Unit',    units:[100,100] },
  ];

  function rint(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function rpick(arr){ return arr[rint(0, arr.length-1)]; }
  function rrange([a,b]){ return rint(a,b); }

  function generateProperty({ id, locClass } = {}) {
    if (!locClass) locClass = rpick(['A','B','C']);

    const cls = CLASSES[locClass];
    const asset = rpick(ASSETS);
    const units = rrange(asset.units);

    const pricePerUnit = rrange(cls.pricePerUnit);
    const price = pricePerUnit * units;

    const rentPerUnit = rrange(cls.rentPerUnit);
    const gross = rentPerUnit * units;

    const expenses = Math.round(gross * cls.expRate);
    const noi = gross - expenses;

    const downPct = 0.20;
    const cashNeeded = Math.round(price * downPct);

    const roi = noi * 12 / Math.max(cashNeeded, 1);

    return {
      id, locClass, type: asset.name, units,
      price, rentPerUnit, gross, expenses, noi,
      cashNeeded, roi: Number(roi.toFixed(2))
    };
  }

  window.generateProperty = generateProperty;
})();
