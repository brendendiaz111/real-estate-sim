// shows at Month >= 180 (simple summary; win flag displayed)
class EndScene extends Phaser.Scene {
  constructor(){ super('End'); }
  init(data){ this.final = data?.state || {}; this.win = !!data?.win; }
  create(){
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, 680, 340, 0x11161a, 0.96).setStrokeStyle(2, 0x2a3f52);
    this.add.text(w/2, h/2 - 100,
      this.win ? '15 Years Complete — You Survived!' : '15 Years Complete — You Limped In',
      { font:'28px Arial', fill:'#cfe8ff', align:'center', wordWrap:{width:600} }).setOrigin(0.5);

    this.add.text(w/2, h/2 - 40, `Month: ${this.final.month || 0}`, { font:'18px Arial', fill:'#dbeafe' }).setOrigin(0.5);
    this.add.text(w/2, h/2 - 10, `Cash: $${(this.final.cash||0).toLocaleString()}`, { font:'18px Arial', fill:'#dbeafe' }).setOrigin(0.5);
    this.add.text(w/2, h/2 + 20, `Equity: $${(this.final.equity||0).toLocaleString()}`, { font:'18px Arial', fill:'#dbeafe' }).setOrigin(0.5);
    this.add.text(w/2, h/2 + 50, `Properties: ${this.final.portfolio?.length || 0}`, { font:'18px Arial', fill:'#dbeafe' }).setOrigin(0.5);

    this.add.text(w/2, h/2 + 110, '[ Play Again ]', { font:'22px Arial', fill:'#bde0fe' })
      .setOrigin(0.5).setInteractive({useHandCursor:true})
      .on('pointerup', () => {
        if (window.save?.resetSave) window.save.resetSave();
        this.scene.start('Start');
      });
  }
}
window.EndScene = EndScene;
