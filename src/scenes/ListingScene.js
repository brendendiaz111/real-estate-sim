// src/scenes/ListingScene.js — modal for property details + BUY / PASS / RENOVATE
class ListingScene extends Phaser.Scene {
  constructor(){ super('Listing'); }

  init(data){
    this.parentKey = data?.parentKey || 'Game';
    this.mapKey    = data?.mapKey    || 'Map';
    this.listing   = data?.listing;        // { id, locClass, type, units, price, ... }
    this.dotId     = data?.dotId;          // numeric id used for highlighting
  }

  create(){
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor('#0f1115');

    const game = this.scene.get(this.parentKey);
    // hide HUD while modal is open
    if (game?.hud) game.hud.setVisible(false);

    // backdrop panel
    const panel = this.add.rectangle(w/2, h/2, 640, 360, 0x151923, 0.96)
      .setStrokeStyle(2, 0x2e3440);

    const L = this.listing;
    const mods = game?.state?.role?.mods || {};
    const yourPrice = Math.round(L.price * (mods.buyPriceMult || 1));

    this.add.text(w/2, h/2 - 130, 'Listing', { font:'22px Arial', fill:'#cfe8ff' }).setOrigin(0.5);
    const body = 
      `${L.type} (${L.locClass}) • ${L.units} unit${L.units>1?'s':''}\n` +
      `List Price: $${L.price.toLocaleString()}\n` +
      `Your Price: $${yourPrice.toLocaleString()}\n` +
      `Rent/Unit:  $${L.rentPerUnit}/mo\n` +
      `NOI:        $${L.noi.toLocaleString()}/mo`;
    this.add.text(w/2 - 240, h/2 - 70, body, { font:'18px Arial', fill:'#dbeafe', lineSpacing:8 });

    // BUY
    this.add.text(w/2 - 120, h/2 + 110, '[ BUY ]', { font:'18px Arial', fill:'#9bf6a3' })
      .setInteractive({useHandCursor:true})
      .on('pointerup', () => {
        const ok = game && game.tryBuy ? game.tryBuy(L) : false;
        if (ok) {
          const map = this.scene.get(this.mapKey);
          const dot = map?.dots?.[this.dotId];
          if (dot) dot.setStrokeStyle(2, 0x72ccff).setScale(1.2);
          this.close();
        }
      });

    // PASS
    this.add.text(w/2 - 20, h/2 + 110, '[ PASS ]', { font:'18px Arial', fill:'#ffadad' })
      .setInteractive({useHandCursor:true})
      .on('pointerup', () => this.close());

    // RENOVATE (optional)
    this.add.text(w/2 + 100, h/2 + 110, '[ RENOVATE ]', { font:'18px Arial', fill:'#a5f3fc' })
      .setInteractive({useHandCursor:true})
      .on('pointerup', () => {
        const scope  = prompt('Scope? cosmetic | moderate | heavy', 'cosmetic') || 'cosmetic';
        const budget = Math.max(0, parseInt(prompt('Budget $:', '15000') || '0', 10));
        if (!budget || !window.renovation?.plan) return;
        const project = window.renovation.plan({
          propertyId: L.id, locClass: L.locClass, units: L.units, budget, scope
        });
        game.state.projects.push(project);
        game.hud?.setStatus?.(`Queued ${scope} renovation for property #${L.id}.`);
        this.close();
      });

    // Close button / ESC
    const close = () => this.close();
    this.add.text(w - 120, 20, '[Close]', { font:'18px Arial', fill:'#bde0fe' })
      .setInteractive({useHandCursor:true})
      .on('pointerup', close);
    this.input.keyboard.on('keydown-ESC', close);
  }

  close(){
    const game = this.scene.get(this.parentKey);
    if (game?.hud) game.hud.setVisible(true);
    this.scene.stop(); // stop this overlay
  }
}

window.ListingScene = ListingScene;
