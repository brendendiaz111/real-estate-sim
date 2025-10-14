// src/scenes/MapScene.js  — Background map + clickable property dots
class MapScene extends Phaser.Scene {
  constructor(){ super('Map'); }

  preload(){
    // safe-load bg (dashed filename)
    if (!this.textures.exists('city-bg')) {
      this.load.image('city-bg', './assets/images/city-bg.png');
    }
  }

  create(){
    const w = this.scale.width, h = this.scale.height;

    // backdrop
    if (this.textures.exists('city-bg')) {
      const bg = this.add.image(w/2, h/2, 'city-bg').setAlpha(0.25);
      // scale if needed:
      // bg.setScale(Math.max(w / bg.width, h / bg.height));
    }

    // spawn clickable “properties”
    const cols = 10, rows = 5, left = 260, top = 100, cellW = 60, cellH = 80;
    let id = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = left + c * cellW, y = top + r * cellH;
        const dot = this.add.circle(x, y, 8, 0x9ad9ff)
          .setStrokeStyle(2, 0x3a78a5)
          .setInteractive({ useHandCursor: true });

        const locClass = ['A','B','C'][Math.floor(Math.random()*3)];
        if (locClass === 'A') dot.setFillStyle(0xa0ffc8);
        if (locClass === 'B') dot.setFillStyle(0xfff3a0);
        if (locClass === 'C') dot.setFillStyle(0xffb0b0);

        dot.on('pointerup', () => this.openListing({ id, locClass }));
        id++;
      }
    }

    this.add.text(260, h - 32, 'Click a dot to see a listing',
      { font: '16px Arial', fill: '#bde0fe' });

    this.scene.sendToBack(); // keep Map behind Game HUD
  }

  // small listing overlay (BUY/PASS)
openListing(seed){
  const gen = window.generateProperty;
  const base = gen ? gen(seed) : {
    type:'SFH', locClass:'B', units:1,
    price:200000, rentPerUnit:1400, gross:1400, expenses:560, noi:840,
    cashNeeded:40000, roi:0.25
  };

  // read player role to show their adjusted purchase price
  const game = this.scene.get('Game');
  const mods = (game && game.state && game.state.role && game.state.role.mods) ? game.state.role.mods : {};
  const yourPrice = Math.round(base.price * (mods.buyPriceMult || 1));

  if (this.panel) this.panel.destroy();

  const box = this.add.rectangle(640, 330, 600, 340, 0x13161c, 0.96).setStrokeStyle(2, 0x2e3440);
  const t = this.add.text(420, 230,
    `${base.type} (${base.locClass}) • ${base.units} units\n` +
    `List Price: $${base.price.toLocaleString()}\n` +
    `Your Price: $${yourPrice.toLocaleString()}\n` +
    `Rent/Unit: $${base.rentPerUnit}/mo   NOI: $${base.noi}/mo`,
    { font: '18px Arial', fill: '#dbeafe', lineSpacing: 8 });

  const buy = this.add.text(480, 430, '[ BUY ]',
    { font: '18px Arial', fill: '#9bf6a3' })
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      // pass the base listing; GameScene applies modifiers & saves
      const ok = game && game.tryBuy ? game.tryBuy(base) : false;
      if (ok) this.closePanel();
    });

  const pass = this.add.text(560, 430, '[ PASS ]',
    { font: '18px Arial', fill: '#ffadad' })
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => this.closePanel());

  this.panel = this.add.container(0, 0, [box, t, buy, pass]).setDepth(5);
}

  handleBuy(p){
    const game = this.scene.get('Game');
    if (game && game.tryBuy) {
      const ok = game.tryBuy(p);
      if (ok) this.closePanel();
    }
  }

  closePanel(){ if (this.panel) { this.panel.destroy(); this.panel = null; } }
}

window.MapScene = MapScene;
