// shows when cash < $50,000
class LoseScene extends Phaser.Scene {
  constructor(){ super('Lose'); }
  init(data){ this.final = data?.state || {}; }
  create(){
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, 620, 300, 0x1a1214, 0.96).setStrokeStyle(2, 0x5c2b31);
    this.add.text(w/2, h/2 - 90, 'Bankrupt!', { font:'36px Arial', fill:'#ffb3b3' }).setOrigin(0.5);
    this.add.text(w/2, h/2 - 40, `Month: ${this.final.month || 0}`, { font:'18px Arial', fill:'#ffdada' }).setOrigin(0.5);
    this.add.text(w/2, h/2 - 10, `Cash: $${(this.final.cash||0).toLocaleString()}`, { font:'18px Arial', fill:'#ffdada' }).setOrigin(0.5);
    this.add.text(w/2, h/2 + 20, `Equity: $${(this.final.equity||0).toLocaleString()}`, { font:'18px Arial', fill:'#ffdada' }).setOrigin(0.5);

    this.add.text(w/2, h/2 + 90, '[ Restart ]', { font:'22px Arial', fill:'#ffc6c6' })
      .setOrigin(0.5).setInteractive({useHandCursor:true})
      .on('pointerup', () => {
        if (window.save?.resetSave) window.save.resetSave();
        this.scene.start('Start');
      });
  }
}
window.LoseScene = LoseScene;
