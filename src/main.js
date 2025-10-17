function gameSize() {
  const adWidth = 200; // matches .ads in CSS
  const w = Math.max(640, window.innerWidth - adWidth);
  const h = Math.max(480, window.innerHeight);
  return { w, h };
}

const { w, h } = gameSize();

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: w,
  height: h,
  backgroundColor: '#0f1115',
  scene: [ StartScene, MapScene, GameScene, StatsScene, HoldingsScene ]
};

const game = new Phaser.Game(config);

// keep the canvas sized to the window
window.addEventListener('resize', () => {
  const { w, h } = gameSize();
  game.scale.resize(w, h);
});
