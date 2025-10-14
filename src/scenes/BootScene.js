class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // Safe preload (if the file is missing, we catch it in MapScene)
    this.load.image('city-bg', './assets/images/city-bg.png');
  }
  create() {
    this.scene.start('Start');
  }
}
window.BootScene = BootScene;
