// HoldingsScene.js — lists owned properties; lets you Sell; closes with P/ESC
class HoldingsScene extends Phaser.Scene {
  constructor(){ super('Holdings'); }

  init(data){ this.parentKey = data?.parentKey || 'Game'; }

  create(){
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor('#0f1115');

    const game = this.scene.get(this.parentKey);
    const portfolio = game?.state?.portfolio || [];

    // Backdrop panel
    const panel = this.add.rectangle(w/2, h/2, 720, 460, 0x151923, 0.96)
      .setStrokeStyle(2, 0x2e3440);

    this.add.text(w/2, 140, 'Holdings', { font:'24px Arial', fill:'#cfe8ff' }).setOrigin(0.5);

    if (!portfolio.length) {
      this.add.text(w/2, h/2, 'No properties owned yet.', { font:'18px Arial', fill:'#bde0fe' }).setOrigin(0.5);
    } else {
      const header = ' #   Units  Loc   Value        Loan        NOI/mo';
      this.add.text(300, 170, header, { font:'14px Arial', fill:'#9aa3ad' }).setOrigin(0,0.5);

      const startY = 195;
      portfolio.forEach((p, i) => {
        const y = startY + i*28;
        const line = `${String(i+1).padStart(2,' ')}   ${String(p.units).padStart(3,' ')}   ${p.location.padEnd(3,' ')}   $${p.price.toLocaleString().padStart(10,' ')}   $${(p.loan||0).toLocaleString().padStart(10,' ')}   $${(p.lastMonthlyNI||0).toLocaleString()}`;
        this.add.text(300, y, line, { font:'14px Arial', fill:'#dbeafe' }).setOrigin(0,0.5);

      const renoBtn = this.add.text(x + 60, y, '[ Renovate ]',
      { font:'16px Arial', fill:'#a5f3fc' })
      .setInteractive({ useHandCursor:true })
      .on('pointerup', () => {
        const scope = prompt('Scope? cosmetic | moderate | heavy', 'cosmetic') || 'cosmetic';
        const budget = Math.max(0, parseInt(prompt('Budget $ (whole dollars):', '20000')||'0',10));
        if (!budget) return;

        const game = this.scene.get('Game');
        const project = window.renovation.plan({
          propertyId: row.property.id,
          locClass: row.property.locClass,
          units: row.property.units,
          budget, scope
        });

    game.state.projects.push(project);
    game.state.cash -= Math.min(1000, budget*0.1); // small deposit now (optional)
    game.hud?.setStatus?.(`Started ${scope} renovation on #${row.property.id} — budget $${budget.toLocaleString()}.`);
  });


        const sell = this.add.text(860, y, '[ Sell ]', { font:'14px Arial', fill:'#ffadad' })
          .setOrigin(1,0.5).setInteractive({useHandCursor:true})
          .on('pointerup', () => {
            if (game?.sellProperty) game.sellProperty(i);
            this.refresh(); // redraw list after selling
          });
      });
    }

    // Close controls
    this.add.text(w/2, h - 48, '[ Press P or ESC to Close ]', { font:'14px Arial', fill:'#aaa' }).setOrigin(0.5);
    const close = () => { this.scene.stop(); if (this.scene.get(this.parentKey)?.hud) this.scene.get(this.parentKey).hud.setVisible(true); };
    this.input.keyboard.on('keydown-P', close);
    this.input.keyboard.on('keydown-ESC', close);
    this.add.text(w - 120, 20, '[Close]', { font:'18px Arial', fill:'#bde0fe' })
      .setInteractive({useHandCursor:true})
      .on('pointerup', close);
  }

refresh(){
  this.scene.restart({ parentKey: this.parentKey });
}

}
window.HoldingsScene = HoldingsScene;
