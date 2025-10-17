// GameScene.js — HUD + state; no persistence (always fresh run)
class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  init(data) {
    const fresh = {
      month: 1, cash: 100000, assets: 100000, liabs: 0, equity: 100000,
      equityPct: 1, credit: 700, portfolio: [],
      role: data?.role || null,
      history: [], flags: { bankrupt:false, reachedHorizon:false }
    };
    this.state = fresh; // <-- always fresh; no loading
  }

  create() {
    // Ensure Map exists and is behind HUD
    if (!this.scene.isActive('Map')) this.scene.launch('Map');
    this.scene.sendToBack('Map');

    // === HUD ==========================================================
    this.hud = this.add.container(0, 0);
    this.hudCash  = this.add.text(260, 24,  '', { fontSize: '20px', color: '#bfe3ff' });
    this.hudMonth = this.add.text(260, 48,  '', { fontSize: '16px', color: '#bfe3ff' });
    this.hudProps = this.add.text(260, 68,  '', { fontSize: '16px', color: '#bfe3ff' });
    this.hudRole  = this.add.text(640, 24,  'Role: —', { fontSize: '18px', color: '#bfe3ff' });
    this.hud.add([ this.hudCash, this.hudMonth, this.hudProps, this.hudRole ]);

    const hint = this.add.text(330, this.scale.height - 60,
      'Press G or click [Graphs] to view performance',
      { fontSize: '16px', color: '#9aa4af' });
    this.hud.add(hint);

    // === NEXT MONTH BUTTON ===============================================
    const nextBtn = this.add.text(
      this.scale.width - 210, this.scale.height - 28, '[ Next Month ▶ ]',
      { fontSize: '16px', color: '#c7c7ff' }
    )
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.nextMonth());
    this.hud.add(nextBtn);
    // Optional hotkey
    this.input.keyboard.on('keydown-N', () => this.nextMonth());

    //small button besides graphs to pop up portfolio
    const holdBtn = this.add.text(
      this.scale.width - 320, this.scale.height - 56, '[ Holdings ]',
      { fontSize: '20px', color: '#bfe3ff', backgroundColor: '#222a', padding: { x:10, y:6 } }
    ).setInteractive({useHandCursor:true})
    .on('pointerover', () => holdBtn.setStyle({ color:'#fff' }))
    .on('pointerout',  () => holdBtn.setStyle({ color:'#bfe3ff' }))
    .on('pointerup',   () => this.input.keyboard.emit('keydown-P')); // reuse same handler
    this.hud.add(holdBtn);

    // Stats (G)
    this.input.keyboard.on('keydown-G', () => {
      this.scene.isActive('Stats')
        ? this.closeOverlay('Stats')
        : this.openOverlay('Stats', { history: this.state.history });
    });

    // Holdings (P)
    this.input.keyboard.on('keydown-P', () => {
      this.scene.isActive('Holdings')
        ? this.closeOverlay('Holdings')
        : this.openOverlay('Holdings', { parentKey: 'Game' });
    });

    // As a safety, re-sync on scene wake
    this.events.on('wake', () => this.syncHUDVisibility());

    // GameScene.create()
    const roleKey = this.registry.get('role') || 'Attorney';
    this.roles = this.roles || {
      Attorney: { label:'Attorney', mods:{ buyPriceMult:0.95, expenseMult:1.00, loanAPR:0.055 } },
      Handyman: { label:'Handyman', mods:{ buyPriceMult:1.00, expenseMult:0.90, loanAPR:0.062 } },
      Agent:    { label:'Real Estate Agent', mods:{ buyPriceMult:0.97, expenseMult:1.00, loanAPR:0.060 } },
    };
    this.state.role = this.roles[roleKey];

    this.state.projects = this.state.projects || [];  // active + completed (archived) projects

    this.refreshHUD();
  }

openOverlay(key, data){
  if (!this.scene.isActive(key)) {
    this.scene.launch(key, data || {});
    this.hud.setVisible(false);
  }
}

closeOverlay(key){
  if (this.scene.isActive(key)) {
    this.scene.stop(key);
    this.hud.setVisible(true);
  }
}

// Keep HUD honest if scenes wake/resume
syncHUDVisibility(){
  const anyOverlay = this.scene.isActive('Stats') || this.scene.isActive('Holdings');
  this.hud.setVisible(!anyOverlay);
}

  // called by MapScene on [BUY]
  tryBuy(listing) {
    const mods = this.state.role?.mods || {};
    const buyMult = mods.buyPriceMult || 1;
    const price = Math.round(listing.price * buyMult);

    const downPct = 0.20;
    const down = Math.round(price * downPct);
    if (this.state.cash < down) { this.toast('Not enough cash for 20% down.'); return false; }

    const expenseMult = mods.expenseMult || 1;
    const apr = mods.loanAPR || 0.065;

    const prop = {
      id: Date.now(),
      price,
      units: listing.units,
      avgRent: listing.rentPerUnit,
      location: listing.locClass,
      downPct,
      loanAPR: apr,
      termYears: 30,
      vacancyRatePct: 5,
      expensesAnnual: { ops: Math.round((listing.expenses || 0) * 12 * expenseMult) },
      miAnnual: 0,
      loan: Math.round(price * (1 - downPct)),
      lastMonthlyNI: 0
    };

    this.state.cash -= down;
    this.state.portfolio.push(prop);
    this.refreshHUD();
    this.checkEndConditions();
    return true;
  }

  // optional from prior step: sellProperty(index) if you kept Holdings
  sellProperty(index){
    const mods = this.state.role?.mods || {};
    const sellMult = mods.sellPriceMult || 1.0;
    const p = this.state.portfolio[index];
    if (!p) return;
    const gross = Math.round(p.price * 0.95 * sellMult);
    const net   = Math.max(0, gross - (p.loan || 0));
    this.state.cash += net;
    this.state.portfolio.splice(index, 1);
    this.refreshHUD();
    this.toast(`Sold: +$${net.toLocaleString()}`);
  }

  nextMonth() {
        // === Renovation phase =========================================
    const p = this.state.projects || [];
    // Withdraw this month’s renovation cash (reduces cash-on-hand)
    const renoDraw = window.renovation.tick(p);
    this.state.cash -= renoDraw;

    // After other monthly updates (or here), apply completed projects
    const applied = window.renovation.applyGains(
      p,
      // quick lookup: your holdings are in this.state.portfolio or catalog lookup
      Object.fromEntries(this.state.portfolio.map(prop => [prop.id, prop]))
    );

    // Optional: surface a toast if something finished
    if (applied.length){
      const totalVG = applied.reduce((s,a)=>s+a.valueGain,0).toLocaleString();
      this.hud?.setStatus?.(`Renovations complete: +$${totalVG} value; rents increased.`);
    }
    
    const market  = window.market  || { appreciationRate: () => 0, vacancyRate: () => 0.06 };
    const credit  = window.credit  || { creditFromEquityPct: () => 650 };

    let deltaCash = 0, totalAssets = 0, totalDebt = 0, debtMonthlySum = 0;
    this.state.month++;

    this.state.portfolio.forEach(p => {
      const apprRate = market.appreciationRate(p.location, this.state.month);
      p.price = Math.round(p.price * (1 + apprRate / 12));

      const vacAnnual = market.vacancyRate(p.location, this.state.month);
      p.vacancyRatePct = Math.round(vacAnnual * 100);

      const result = window.finance.evaluateDeal({
        price: p.price, downPct: p.downPct, loanAPR: p.loanAPR, termYears: p.termYears,
        units: p.units, avgRent: p.avgRent, vacancyRatePct: p.vacancyRatePct,
        expensesAnnual: p.expensesAnnual, closingCosts: 0, miAnnual: p.miAnnual,
        appreciationRate: apprRate
      });

      p.lastMonthlyNI = Math.round((result?.monthlyNI ?? 0));
      deltaCash += p.lastMonthlyNI;
      debtMonthlySum += (result?.debtAnn ?? 0) / 12;
      totalAssets += p.price;
      totalDebt   += p.loan;
    });

    this.state.cash   += deltaCash;
    this.state.assets  = Math.round(totalAssets + this.state.cash);
    this.state.liabs   = Math.round(totalDebt);
    this.state.equity  = Math.max(0, this.state.assets - this.state.liabs);
    this.state.equityPct = this.state.assets === 0 ? 0 : (this.state.equity / this.state.assets);
    this.state.credit  = credit.creditFromEquityPct(this.state.equityPct);

    if (this.state.month >= 180) this.state.flags.reachedHorizon = true;
    if (this.state.cash < 50000) this.state.flags.bankrupt = true;

    this.state.history.push({
      m: this.state.month, cash: this.state.cash, equity: this.state.equity,
      assets: this.state.assets, liabs: this.state.liabs
    });

    this.refreshHUD();
    this.checkEndConditions();
  }

  checkEndConditions() {
    if (this.state.cash < -10000) {
      this.scene.stop('Map');
      this.scene.start('Lose', { state: this.state });
      return true;
    }
    if (this.state.month >= 180) {
      const win = this.state.equity > 0;
      this.scene.stop('Map');
      this.scene.start('End', { state: this.state, win });
      return true;
    }
    return false;
  }

  // HUD helpers
  cashText(){ return `Cash: $${this.state.cash.toLocaleString()}`; }
  monthText(){ return `Month: ${this.state.month}`; }
  propsText(){ return `Properties: ${this.state.portfolio.length}`; }

  refreshHUD(){
    if (this.hudCash)  this.hudCash.setText(this.cashText());
    if (this.hudMonth) this.hudMonth.setText(this.monthText());
    if (this.hudProps) this.hudProps.setText(this.propsText());
    if (this.hudRole && this.state.role) this.hudRole.setText(`Role: ${this.state.role.label}`);
  }

  toast(msg){
    const t = this.add.text(260, 80, msg, { font: '16px Arial', fill: '#ffd6a5' }).setDepth(200);
    this.time.delayedCall(1200, () => t.destroy());
  }
}
window.GameScene = GameScene;
