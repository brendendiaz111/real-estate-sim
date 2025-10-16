class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  init(data) { this.gameRef = data.gameRef; }

  create() {
    const w = 960, h = 600;
    const panel = this.add.rectangle(w/2, h/2, 680, 420, 0x1e2229).setStrokeStyle(1, 0x3a4049);
    const cashTxt = this.add.text(panel.x - 300, panel.y - 170, '', { font: '24px Arial', fill: '#6fc2ff' });
    const msgTxt  = this.add.text(panel.x - 300, panel.y - 110, '', { font: '18px Arial', fill: '#ffffff' });
    const offerTxt= this.add.text(panel.x - 300, panel.y - 70,  '', { font: '18px Arial', fill: '#ffffff' });

    const buyBtn  = this.add.text(panel.x - 300, panel.y + 90, '[ BUY ]',  { font: '22px Arial', fill: '#72cc8f' }).setInteractive({useHandCursor:true});
    const passBtn = this.add.text(panel.x - 170, panel.y + 90, '[ PASS ]', { font: '22px Arial', fill: '#ff7c7c' }).setInteractive({useHandCursor:true});
    const nextBtn = this.add.text(panel.x + 220, panel.y + 90, '[ Next Month ▶ ]', { font: '18px Arial', fill: '#c7c7ff' }).setInteractive({useHandCursor:true});

    const portfolioTitle = this.add.text(panel.x - 300, panel.y + 20, 'Portfolio:', { font: '18px Arial', fill: '#aaa' });
    const portfolioTxt   = this.add.text(panel.x - 300, panel.y + 45, '', { font: '16px Arial', fill: '#ddd' });

    buyBtn.on('pointerdown', () => this.gameRef.buyCurrent());
    passBtn.on('pointerdown', () => this.gameRef.passOffer());
    nextBtn.on('pointerdown', () => this.gameRef.nextMonth());

    // Event wiring
    this.gameRef.events.on('cash:changed', v => cashTxt.setText(`Cash: $${v.toLocaleString()}`));
    this.gameRef.events.on('offer:changed', o => {
      offerTxt.setText(
        `House for sale!\n` +
        `Price: $${o.price.toLocaleString()}\n` +
        `Rent: $${o.rent}/mo\n` +
        `Est. Mortgage: $${Math.round(o.mortgage).toLocaleString()}/mo`
      );
      msgTxt.setText('');
    });
    this.gameRef.events.on('portfolio:changed', list => {
      portfolioTxt.setText(list.map((h,i)=>`#${i+1}: $${h.price.toLocaleString()} | $${h.rent}/mo`).join('\n'));
    });
    this.gameRef.events.on('month:tick', ({delta, debt}) => {
      const sign = delta >= 0 ? '+' : '−';
      msgTxt.setText(`Month advanced ${sign}$${Math.abs(delta).toLocaleString()} (after debt ~$${Math.round(debt).toLocaleString()}/mo).`);
    });
    this.gameRef.events.on('toast', t => msgTxt.setText(t));

    // Initialize UI from current state
    const s = this.gameRef.state;
    cashTxt.setText(`Cash: $${s.cash.toLocaleString()}`);
    portfolioTxt.setText(s.portfolio.map((h,i)=>`#${i+1}: $${h.price.toLocaleString()} | $${h.rent}/mo`).join('\n'));

    // Canvas size
    this.game.scale.resize(w + 220, h); // space for ad column
    this.game.canvas.style.marginLeft = '220px'; // keep ad sidebar visible
  }
}
window.UIScene = UIScene;
