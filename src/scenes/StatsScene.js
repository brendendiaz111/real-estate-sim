// src/scenes/StatsScene.js — graphs cash/equity with X and Y axes labeled
class StatsScene extends Phaser.Scene {
  constructor(){ super('Stats'); }

  create(){
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor('#0f1115');

    const save = window.save?.loadSave?.() || {};
    const hist = save.history || [];

    this.add.text(w/2, 40, 'Performance Over Time',
      { font:'24px Arial', fill:'#bde0fe' }).setOrigin(0.5);

    const g = this.add.graphics().setDepth(5);
    const margin = 80, chartW = w - margin*2, chartH = h - margin*3;
    const x0 = margin, y0 = h - margin;

    g.lineStyle(1, 0x5a5f66);
    g.strokeRect(x0, y0 - chartH, chartW, chartH);

    if (hist.length > 1) {
      const maxCash = Math.max(...hist.map(pt => pt.cash));
      const maxEquity = Math.max(...hist.map(pt => pt.equity));
      const maxY = Math.max(1, maxCash, maxEquity);

      const minM = hist[0].m ?? 1;
      const maxM = hist[hist.length - 1].m ?? hist.length;
      const spanM = Math.max(1, maxM - minM);

      const scaleX = (m) => x0 + ((m - minM) / spanM) * chartW;
      const scaleY = (val) => y0 - (val / maxY) * chartH;

      // Lines
      g.lineStyle(2, 0x9bf6a3);
      g.beginPath();
      hist.forEach((pt, i) => {
        const X = scaleX(pt.m);
        const Y = scaleY(pt.cash);
        if (i===0) g.moveTo(X,Y); else g.lineTo(X,Y);
      });
      g.strokePath();

      g.lineStyle(2, 0x72ccff);
      g.beginPath();
      hist.forEach((pt, i) => {
        const X = scaleX(pt.m);
        const Y = scaleY(pt.equity);
        if (i===0) g.moveTo(X,Y); else g.lineTo(X,Y);
      });
      g.strokePath();

      // Legend
      this.add.text(x0, y0 - chartH - 24, 'Cash (green) / Equity (blue)', 
        { font:'14px Arial', fill:'#bde0fe' });

      // --- X-axis ticks (months) ---
      let step;
      if (spanM <= 24) step = 6;
      else if (spanM <= 60) step = 12;
      else if (spanM <= 120) step = 24;
      else step = 36;

      g.lineStyle(1, 0x3a4048, 1);
      for (let m = Math.ceil(minM/step)*step; m <= maxM; m += step) {
        const X = scaleX(m);
        g.beginPath();
        g.moveTo(X, y0);
        g.lineTo(X, y0 + 6);
        g.strokePath();
        this.add.text(X, y0 + 10, `${m}`, { font:'12px Arial', fill:'#9aa3ad' })
          .setOrigin(0.5, 0);
      }
      this.add.text(x0 + chartW/2, y0 + 28, 'Month (Turns)',
        { font:'12px Arial', fill:'#9aa3ad' }).setOrigin(0.5, 0);

      // --- Y-axis ticks (money) ---
      const yTicks = 5;
      for (let i = 0; i <= yTicks; i++) {
        const val = (maxY / yTicks) * i;
        const Y = scaleY(val);
        g.lineStyle(1, 0x3a4048, 1);
        g.beginPath();
        g.moveTo(x0 - 6, Y);
        g.lineTo(x0, Y);
        g.strokePath();
        this.add.text(x0 - 10, Y, `$${Math.round(val/1000)}k`, 
          { font:'12px Arial', fill:'#9aa3ad' }).setOrigin(1, 0.5);
      }
      this.add.text(x0 - 40, y0 - chartH/2, 'Value ($)', 
        { font:'12px Arial', fill:'#9aa3ad' })
        .setOrigin(0.5, 0.5)
        .setAngle(-90);
    } else {
      this.add.text(w/2, h/2, 'Not enough data yet.',
        { font:'18px Arial', fill:'#bde0fe' }).setOrigin(0.5);
    }

    // Close instructions
    this.add.text(w/2, h - 40, '[ Press G to Close ]',
      { font:'16px Arial', fill:'#aaa' }).setOrigin(0.5);

    this.input.keyboard.once('keydown-G', ()=>{
      this.scene.stop();
      this.scene.resume('Game');
    });
  }
}
window.StatsScene = StatsScene;
