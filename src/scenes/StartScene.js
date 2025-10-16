// StartScene.js — adds career selection, then launches Map + Game
class StartScene extends Phaser.Scene {
  constructor(){ super('Start'); }

  create(){
    const w = 960, h = 600;
    this.cameras.main.setBackgroundColor('#0f1115');

    const w2 = w/2, h2 = h/2;
    this.add.text(w2, h2 - 80, 'Real Estate Sim', { font: '32px Arial', fill: '#cfe8ff' }).setOrigin(0.5);

const newBtn = this.add.text(w2, h2, '[ New Game ]', { font: '24px Arial', fill: '#72ccff' })
  .setInteractive({useHandCursor:true})
  .on('pointerup', () => this.showCareerPicker())
  .setOrigin(0.5);

    // sidebar space for ad rail
    this.game.canvas.style.marginLeft = '220px';
  }

  showCareerPicker(){
    const w = this.scale.width, h = this.scale.height;

    if (this.picker) this.picker.destroy();

    const roles = [
      {
        key:'attorney', label:'Attorney',
        desc:'Better rates.',
        mods:{ loanAPR: 0.055 } // default 6.5% → 5.5%
      },
      {
        key:'handyman', label:'Handyman',
        desc:'Lower expenses & renovation cost.',
        mods:{ expenseMult: 0.9, renoCostMult: 0.75 }
      },
      {
        key:'agent', label:'Real Estate Agent',
        desc:'Better buy & sell prices.',
        mods:{ buyPriceMult: 0.95, sellPriceMult: 1.05 }
      },
    ];

    const box = this.add.rectangle(480, 330, 620, 320, 0x151923, 0.99).setStrokeStyle(2, 0x2e3440);
    const title = this.add.text(480, 220, 'Choose Your Character', { font:'24px Arial', fill:'#cfe8ff' }).setOrigin(0.5);

    const items = [];
    roles.forEach((r, i) => {
      const y = 255 + i*70;
      const text = this.add.text(290, y, `[ ${r.label} ] — ${r.desc}`,
        { font:'18px Arial', fill:'#bde0fe' })
        .setInteractive({useHandCursor:true})
        .on('pointerup', () => {
          this.startGame({ newGame:true, role:r });
        });
      items.push(text);
    });

    const cancel = this.add.text(480, 450, '[ Cancel ]', { font:'18px Arial', fill:'#ffadad' })
      .setOrigin(0.5)
      .setInteractive({useHandCursor:true})
      .on('pointerup', () => this.picker.destroy());

    this.picker = this.add.container(0,0,[box,title,...items,cancel]);
  }

  startGame(data){
    // Launch background map, then the game (HUD/logic)
    this.scene.launch('Map');
    this.scene.start('Game', data || {});
  }
}

window.StartScene = StartScene;
