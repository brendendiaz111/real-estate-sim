// GameScene.js — HUD + state; applies career modifiers; win/loss checks
class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  init(data) {
    const saved = (window.save && window.save.loadSave) ? window.save.loadSave() : null;

    const fresh = {
      month: 1, cash: 100000, assets: 100000, liabs: 0, equity: 100000,
      equityPct: 1, credit: 700, portfolio: [],
      role: data?.role || null,        // <-- store role from StartScene
      history: [], flags: { bankrupt:false, reachedHorizon:false }
    };

    // if continuing, keep saved role; if new, use role passed from Start
    this.state = (data && data.newGame) ? fresh : (saved || fresh);
  }

  create() {
    // === HUD CONTAINER ==================================================
    this.hud = this.add.container(0, 0);

    // HUD texts (names match refreshHUD)
    this.hudCash  = this.add.text(260, 24,  '', { fontSize: '20px', color: '#bfe3ff' });
    this.hudMonth = this.add.text(260, 48,  '', { fontSize: '16px', color: '#bfe3ff' });
    this.hudProps = this.add.text(260, 68,  '', { fontSize: '16px', color: '#bfe3ff' });
    this.hudRole  = this.add.text(640, 24,  'Role: —', { fontSize: '18px', color: '#bfe3ff' });

    this.hud.add([ this.hudCash, this.hudMonth, this.hudProps, this.hudRole ]);

    this.hintText = this.add.text(
      330, this.scale.height - 60,
      'Press G or click [Graphs] to view performance',
      { fontSize: '16px', color: '#9aa4af' }
    );
    this.hud.add(this.hintText);

    // === GRAPHS BUTTON ==================================================
    const graphsBtn = this.add.text(
      this.scale.width - 170, this.scale.height - 56, '[ Graphs ]',
      { fontSize: '20px', color: '#bfe3ff', backgroundColor: '#222a', padding: { x: 10, y: 6 } }
    )
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => graphsBtn.setStyle({ color: '#fff' }))
      .on('pointerout',  () => graphsBtn.setStyle({ color: '#bfe3ff' }))
      .on('pointerup',   () => this.toggleStats());
    this.hud.add(graphsBtn);

    // === HOTKEYS ========================================================
    this.input.keyboard.on('keydown-G',   () => this.toggleStats());
    this.input.keyboard.on('keydown-ESC', () => {  // ESC closes stats if open
      if (this.scene.isActive('Stats')) {
        this.scene.stop('Stats');
        this.hud.setVisible(true);
      }
    });

    // === TOGGLE HANDLER =================================================
    this.toggleStats = () => {
      const key = 'Stats'; // scene key registered in StatsScene
      if (this.scene.isActive(key)) {
        this.scene.stop(key);
        this.hud.setVisible(true);
      } else {
        this.scene.launch(key, { history: this.state?.history || [] });
        this.hud.setVisible(false);
      }
    };

    // Initial HUD text
    this.refreshHUD();

    // Launch the UI overlay with [BUY]/[PASS]/[Next Month ▶]
    this.scene.launch('UI', { gameRef: this }); // UIScene reads gameRef and wires buttons to nextMonth(), etc. 
  }

  // called by MapScene on [BUY]
  tryBuy(listing) {
    const mods = this.state.role?.mods || {};
    const buyMult = mods.buyPriceMult || 1;
    const price = Math.round(listing.price * buyMult); // Agent benefit

    const downPct = 0.20;
    const down = Math.round(price * downPct);
    if (this.state.cash < down) { 
      this.toast('Not enough cash for 20% down.');
      this.events.emit('toast', 'Not enough cash for 20% down.');
      return false; 
    }

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

    // UI updates
    this.refreshHUD();
    this.events.emit('cash:changed', this.state.cash);
    this.events.emit('portfolio:changed', this.state.portfolio);

    this.save();
    this.checkEndConditions();
    return true;
  }

  nextMonth() {
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
      m: this.state.month,
      cash: this.state.cash,
      equity: this.state.equity,
      assets: this.state.assets,
      liabs: this.state.liabs
    });

    // UI updates
    this.refreshHUD();
    this.events.emit('cash:changed', this.state.cash);
    this.events.emit('month:tick', { delta: deltaCash, debt: debtMonthlySum });

    this.save();
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

  save() {
    if (window.save?.saveGame) window.save.saveGame(this.state);
    else localStorage.setItem('resim_save', JSON.stringify(this.state));
  }
}

window.GameScene = GameScene;
