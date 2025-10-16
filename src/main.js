const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 600,
  backgroundColor: '#0f1115',
  // Only include scenes that are DEFINITELY defined on window.*
  scene: [ StartScene, MapScene, GameScene, StatsScene, HoldingsScene ]
};
new Phaser.Game(config);

//alphalivinglegend111111111111