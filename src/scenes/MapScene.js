// src/scenes/MapScene.js — Responsive background + deterministic, zoned properties
class MapScene extends Phaser.Scene {
  constructor(){ super('Map'); }

  preload(){
    if (!this.textures.exists('city-bg')) {
      this.load.image('city-bg', './assets/images/city-bg.png');
    }
  }

  create(){
    const w = this.scale.width, h = this.scale.height;

    // background scaled to fill
    if (this.textures.exists('city-bg')) {
      const bg = this.add.image(w/2, h/2, 'city-bg').setAlpha(0.25);
      const s = Math.max(w / bg.width, h / bg.height);
      bg.setScale(s);
      this.bg = bg;
    }

    // deterministic catalog
    this.catalog = [];
    this.dots = [];

    // layout params
    const adLeft = 200, margin = 40;
    const left = adLeft + margin, top = 60;
    const cols = 14, rows = 9;                 // 14×9 = 126 listings
    const cellW = (w - left - margin) / cols;
    const cellH = (h - top - 100) / rows;

    // downtown hub (bottom-left-ish)
    const centerA = { x: left + cellW * 1.5, y: h - 140 };
    const radiusA = Math.min(w, h) * 0.18;

    let id = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = left + c * cellW;
        const y = top  + r * cellH;

        // classify by distance to downtown
        const dx = x - centerA.x, dy = y - centerA.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        let locClass, type, units;
        if (dist <= radiusA) {
          locClass = 'A';
          ({ type, units } = this.pickOne([
            { type:'50-Unit', units:50 }, { type:'100-Unit', units:100 }, { type:'50-Unit', units:50 }
          ]));
        } else if (dist <= radiusA * 1.65) {
          locClass = 'B';
          ({ type, units } = this.pickOne([
            { type:'Duplex',units:2 }, { type:'Triplex',units:3 }, { type:'Quadplex',units:4 }, { type:'Duplex',units:2 }
          ]));
        } else {
          locClass = 'C'; type = 'SFH'; units = 1;
        }

        // value/rent tables
        const pricePU = { A: 220000, B: 150000, C: 90000 }[locClass];
        const rentPU  = { A:   2100, B:   1500, C:   950 }[locClass];
        const expRate = { A:   0.35, B:   0.40, C:  0.45 }[locClass];

        const price = pricePU * units;
        const rentPerUnit = rentPU;
        const gross = rentPerUnit * units;
        const expenses = Math.round(gross * expRate);
        const noi = gross - expenses;

        const listing = { id, locClass, type, units, price, rentPerUnit, gross, expenses, noi, cashNeeded: Math.round(price*0.20) };
        this.catalog[id] = listing;

        const fill = (locClass === 'A') ? 0xa0ffc8 : (locClass === 'B') ? 0xfff3a0 : 0xffb0b0;
        const dot = this.add.circle(x, y, 8, fill).setStrokeStyle(2, 0x3a78a5).setInteractive({ useHandCursor: true });
        dot.on('pointerup', () => this.openListing(id));
        this.dots[id] = dot;
        id++;
      }
    }

    this.add.text(left, h - 32, 'Click a dot to see a listing', { font: '16px Arial', fill: '#bde0fe' });
    this.scene.sendToBack(); // map under HUD

    // background-only resize (full reflow later if needed)
    this.scale.on('resize', (size) => this.relayout(size));
  }

  pickOne(arr){ return arr[(Math.random()*arr.length)|0]; }

  relayout({ width:w, height:h }){
    if (this.bg) {
      this.bg.setPosition(w/2, h/2);
      const s = Math.max(w / this.bg.width, h / this.bg.height);
      this.bg.setScale(s);
    }
  }

  // small listing overlay (BUY/PASS)
  openListing(id){
    const base = this.catalog[id];
    const game = this.scene.get('Game');
    const mods = game?.state?.role?.mods || {};
    const yourPrice = Math.round(base.price * (mods.buyPriceMult || 1));

    if (this.panel) this.panel.destroy();

    const box = this.add.rectangle(this.scale.width/2 + 160, this.scale.height/2 + 30, 600, 340, 0x13161c, 0.96)
      .setStrokeStyle(2, 0x2e3440);
    const t = this.add.text(box.x - 220, box.y - 100,
      `${base.type} (${base.locClass}) • ${base.units} units\n` +
      `List Price: $${base.price.toLocaleString()}\n` +
      `Your Price: $${yourPrice.toLocaleString()}\n` +
      `Rent/Unit: $${base.rentPerUnit}/mo   NOI: $${base.noi}/mo`,
      { font: '18px Arial', fill: '#dbeafe', lineSpacing: 8 });

    const buy = this.add.text(box.x - 140, box.y + 90, '[ BUY ]', { font: '18px Arial', fill: '#9bf6a3' })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        const ok = game && game.tryBuy ? game.tryBuy(base) : false;
        if (ok) {
          const dot = this.dots[id];
          if (dot) { dot.setStrokeStyle(2, 0x72ccff).setScale(1.2); }
          this.closePanel();
        }
      });

    const pass = this.add.text(box.x - 40, box.y + 90, '[ PASS ]', { font: '18px Arial', fill: '#ffadad' })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.closePanel());

    this.panel = this.add.container(0, 0, [box, t, buy, pass]).setDepth(5);

    if (game?.hud) game.hud.setVisible(false);
  }

  closePanel(){
    if (this.panel) { this.panel.destroy(); this.panel = null; }
    const game = this.scene.get('Game');
    if (game?.hud) game.hud.setVisible(true);
  }
}

window.MapScene = MapScene;
