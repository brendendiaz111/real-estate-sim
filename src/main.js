const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 600,
  backgroundColor: '#0f1115',
  scene: [ BootScene, StartScene, MapScene, GameScene, UIScene, LoseScene, EndScene, StatsScene ]
};
new Phaser.Game(config);
//alphalivinglegend