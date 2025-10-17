// src/utils/renovation.js
(function(){
  // === Tuning knobs (edit freely) ===========================================
  // How much a $1 of capex moves asset value by zone:
  // Use Brenden's rule: B = 2x, C = 3x, "ghetto"=0x (treat A as 0x for now; tweak later)
  const VALUE_MULT = { A: 0.0, B: 2.0, C: 3.0 };

  // Rent lift per $1,000 of spend *per unit* (then scaled by zone factor below)
  // e.g., cosmetic = +$8 / $1k / unit; moderate = +$14; heavy = +$25
  const RENT_PER_K_PER_UNIT = { cosmetic: 8, moderate: 14, heavy: 25 };

  // Scope presets: duration (months) and overrun risk (simple % chance)
  const SCOPES = {
    cosmetic: { months: 1, riskOverrunPct: 10 },
    moderate: { months: 3, riskOverrunPct: 20 },
    heavy:    { months: 6, riskOverrunPct: 30 },
  };

  // Zone factor for rent lift (outer C zones react more to upgrades)
  const RENT_ZONE_BONUS = { A: 0.6, B: 1.0, C: 1.3 };

  // Draw pattern for cash: spread evenly over months (simple, predictable)
  // Set to true to front-load 50% on month 1
  const FRONT_LOAD = false;
  // ==========================================================================

  function valueGain(locClass, spend){
    const mult = VALUE_MULT[locClass] ?? 0;
    return Math.round(spend * mult);
  }

  function rentLift(locClass, scopeKey, spend, units){
    const basePerK = RENT_PER_K_PER_UNIT[scopeKey] ?? 0;
    const zoneBoost = RENT_ZONE_BONUS[locClass] ?? 1;
    const perUnit = (spend / 1000) * basePerK * zoneBoost;
    // spread across all units
    return Math.round(perUnit);
  }

  function plan({ propertyId, locClass, units, budget, scope }){
    const p = SCOPES[scope] || SCOPES.cosmetic;
    const months = p.months + (Math.random() * 100 < p.riskOverrunPct ? 1 : 0);

    // draw schedule
    const draw = FRONT_LOAD
      ? [Math.round(budget * 0.5), ...Array(months-1).fill(Math.round(budget * 0.5 / (months-1)))]
      : Array(months).fill(Math.round(budget / months));

    return {
      id: `reno_${Date.now()}_${propertyId}`,
      propertyId, locClass, units,
      scope, budget,
      monthsTotal: months,
      monthsLeft: months,
      drawSchedule: draw, // array of per-month draws
      spent: 0,
      pendingValueGain: valueGain(locClass, budget),
      pendingRentGain: rentLift(locClass, scope, budget, units),
      status: 'active',
    };
  }

  // Advance all projects one month: withdraw cash, decrement timer; return total cash drawn.
  function tick(projects){
    let cashDraw = 0;
    projects.forEach(p => {
      if (p.status !== 'active') return;
      const monthIdx = p.monthsTotal - p.monthsLeft;
      const draw = p.drawSchedule[Math.min(monthIdx, p.drawSchedule.length-1)] || 0;
      p.spent += draw;
      cashDraw += draw;
      p.monthsLeft -= 1;
      if (p.monthsLeft <= 0) p.status = 'complete';
    });
    return cashDraw;
  }

  // Apply finished projects: mutate property {value, rentPerUnit}; return applied effects for HUD.
  function applyGains(projects, propsById){
    const applied = [];
    projects.forEach(p => {
      if (p.status !== 'complete') return;
      const prop = propsById[p.propertyId];
      if (!prop) return;

      prop.price += p.pendingValueGain;
      prop.rentPerUnit += p.pendingRentGain;

      p.status = 'archived';
      applied.push({
        propertyId: p.propertyId,
        valueGain: p.pendingValueGain,
        rentGain: p.pendingRentGain
      });
    });
    return applied;
  }

  window.renovation = { plan, tick, applyGains, valueGain, rentLift };
})();
