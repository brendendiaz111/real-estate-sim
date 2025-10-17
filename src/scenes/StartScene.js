// StartScene.js — adds career selection, then launches Map + Game
class StartScene extends Phaser.Scene {
  constructor(){ super('Start'); }

  // center of the playable area (to the right of the ad rail)
  playableCenter(scale){
    const w = scale.width, h = scale.height;
    const canvas = this.game.canvas;
    const cRect  = canvas.getBoundingClientRect();
    const adEl   = document.querySelector('.ads');
    const aRect  = adEl ? adEl.getBoundingClientRect() : { right: 0 };
    const leftGutterCss = Math.max(0, aRect.right - cRect.left);
    const cssToWorld = w / cRect.width;
    const leftGutter = leftGutterCss * cssToWorld;
    return { x: leftGutter + (w - leftGutter)/2, y: h/2 };
  }

  closePicker(){
    if (this.picker){ this.picker.destroy(); this.picker = null; }
  }

  startGame(roleKey){
    this.registry.set('role', roleKey);
    if (!this.scene.isActive('Game'))      this.scene.launch('Game');
    if (!this.scene.isActive('Map'))       this.scene.launch('Map');
    if (!this.scene.isActive('Stats'))     this.scene.launch('Stats');
    if (!this.scene.isActive('Holdings'))  this.scene.launch('Holdings');
    this.scene.bringToTop('Game');
    this.closePicker();
    this.scene.stop();
  }

  create(){
    const { x:cx, y:cy } = this.playableCenter(this.scale);

    this.title = this.add.text(cx, cy - 80, 'Real Estate Sim',
      { font:'32px Arial', fill:'#cfe8ff' }).setOrigin(0.5);

    this.newBtn = this.add.text(cx, cy, '[ New Game ]',
      { font:'24px Arial', fill:'#72ccff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor:true })
      .on('pointerup', () => this.showCareerPicker());

    this.scale.on('resize', () => {
      const { x, y } = this.playableCenter(this.scale);
      this.title.setPosition(x, y - 80);
      this.newBtn.setPosition(x, y);
      this.centerPicker?.();
    });
  }

  showCareerPicker(){
    this.picker?.destroy();
    const { x:cx, y:cy } = this.playableCenter(this.scale);

    const box = this.add.rectangle(cx, cy, 500, 260, 0x13161c, 0.95).setStrokeStyle(2, 0x2e3440);
    const title = this.add.text(cx, cy - 100, 'Choose Your Character',
      { font:'22px Arial', fill:'#cfe8ff' }).setOrigin(0.5);

    const makeOpt = (y, label, role) =>
      this.add.text(cx, y, label, { font:'18px Arial', fill:'#9cd2ff' })
        .setOrigin(0.5).setInteractive({ useHandCursor:true })
        .on('pointerup', () => this.startGame(role));

    const o1 = makeOpt(cy - 30, '[ Attorney ] — Better rates.', 'Attorney');
    const o2 = makeOpt(cy + 10, '[ Handyman ] — Lower expenses & renovation cost.', 'Handyman');
    const o3 = makeOpt(cy + 50, '[ Real Estate Agent ] — Better buy & sell prices.', 'Agent');

    const cancel = this.add.text(cx, cy + 100, '[ Cancel ]',
      { font:'18px Arial', fill:'#ff8a8a' })
      .setOrigin(0.5).setInteractive({ useHandCursor:true })
      .on('pointerup', () => this.closePicker());

    this.picker = this.add.container(0, 0, [box, title, o1, o2, o3, cancel]);

    this.centerPicker = () => {
      const { x, y } = this.playableCenter(this.scale);
      box.setPosition(x, y);
      title.setPosition(x, y - 100);
      o1.setPosition(x, y - 30);
      o2.setPosition(x, y + 10);
      o3.setPosition(x, y + 50);
      cancel.setPosition(x, y + 100);
    };
  }
}

window.StartScene = StartScene;
