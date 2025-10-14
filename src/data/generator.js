export function generateProperties() {
  const locations = ['A', 'B', 'C'];
  const classes = ['Single Family', 'Duplex', 'Triplex', 'Quadruplex', '5 Unit', '10 Unit', '25 Unit', '50 Unit', '100 Unit'];
  const properties = [];

  for (let i = 0; i < 125; i++) {
    const loc = Phaser.Utils.Array.GetRandom(locations);
    const cls = Phaser.Utils.Array.GetRandom(classes);
    const base = Phaser.Math.Between(50000, 1500000);
    const rent = Math.round(base * Phaser.Math.FloatBetween(0.007, 0.012));
    properties.push({
      id: i+1,
      name: `${cls} in ${loc}`,
      price: base,
      rent,
      location: loc,
      units: getUnits(cls),
      vacancy: getVacancy(loc),
      appreciation: getAppreciation(loc),
    });
  }
  return properties;
}
