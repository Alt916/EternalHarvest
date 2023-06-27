// Scène de jeu
var SceneDeJeu = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize:
    function SceneDeJeu() {
        Phaser.Scene.call(this, { key: 'jeu' });
    },

    preload: function() {
        this.load.image('squelette', 'images/Sprite-0001.png');
        this.load.image('ame', 'images/ames.png');
        this.load.image('dynamite', 'images/dynamite.png');
        this.load.audio('jeuMusic', './Game1.m4a');
        this.load.audio('bruitageAme', './Bruitage1.m4a');
    },

    create: function() {
        this.squelette = this.physics.add.image(100, 100, 'squelette');
        this.squelette.body.collideWorldBounds = true;
        this.squelette.body.gravity.y = 500;

        this.dynamites = this.physics.add.group();
        this.dynamiteTimer = this.time.addEvent({ delay: 9000, callback: this.dropDynamite, callbackScope: this, loop: true });

        this.input.on('pointerdown', this.jump, this);


        this.score = 0;
        this.scoreText = this.add.text(400, 16, 'score: 0', { fontSize: '15px', fill: '#fff' });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.endurance = 0;
        this.enduranceMax = 100;
        this.enduranceBar = this.add.graphics();
        this.canJump = true;

        // Ajoutez les événements de glissement sur toute la scène
    this.input.on('pointerdown', this.handleSwipeStart, this);
    this.input.on('pointerup', this.handleSwipeEnd, this);
    
    // Variables de suivi du geste de glissement
    this.swipeStartX = 0;
    this.swipeEndX = 0;
    this.swipeThreshold = 50;

        // Jouez la musique de la scène de jeu
        let music = this.sound.add('jeuMusic');
        music.play({ loop: false });

        // Les niveaux du jeu
        this.niveau = 1;
        this.niveauText = this.add.text(400, 32, 'Niveau: 1', {fontSize: '15px', fill: '#fff'});

        this.ames = this.physics.add.group({
            key: 'ame',
            repeat: 0,
            setXY: { x: 10, y: 0, stepX: 70 }
        });
        
        this.ames.children.iterate(function (ame) {
            ame.setVelocityY(Phaser.Math.Between(5, 10));
            ame.checkWorldBounds = true;
            ame.outOfBoundsKill = true;
            ame.setGravityY(0);
        });

        this.timer = this.time.addEvent({ delay: 6000, callback: this.dropAme, callbackScope: this, loop: true });
    },

    moveLeft: function() {
        this.squelette.setVelocityX(-200);  // Ajustez la vitesse de déplacement
    },
    
    moveRight: function() {
        this.squelette.setVelocityX(200);  // Ajustez la vitesse de déplacement
    },    

    startSwipe: function(pointer) {
        this.startX = pointer.x;
    },
    
    handleSwipeStart: function(pointer) {
        this.swipeStartX = pointer.x;
    },
    
    handleSwipeEnd: function(pointer) {
    this.swipeEndX = pointer.x;
    
    // Calculer la distance horizontale du geste de glissement
    const swipeDistance = this.swipeEndX - this.swipeStartX;
    
    // Si la distance du geste de glissement dépasse le seuil, déterminez la direction du glissement et effectuez l'action correspondante
    if (Math.abs(swipeDistance) > this.swipeThreshold) {
        if (swipeDistance > 0) {
            this.moveRightTouch();
        } else {
            this.moveLeftTouch();
        }
    }
    // Réinitialiser la position de départ pour le prochain geste de glissement
    this.swipeStartX = this.swipeEndX;
},
    
    
    endSwipe: function(pointer) {
        const deltaX = pointer.x - this.startX;
        
        if (deltaX > 0) {
            this.moveRight();
        } else if (deltaX < 0) {
            this.moveLeft();
        }
    },    
    jump: function() {
        if (this.canJump) {
            this.squelette.setVelocityY(-300);
            this.canJump = false;
    
            if (this.jumpTimeout) {
                clearTimeout(this.jumpTimeout);
            }
    
            this.jumpTimeout = setTimeout(() => {
                this.canJump = true;
                this.jumpTimeout = null;
            }, 1000);
        }
    },
    

    dropDynamite: function() {
        if (this.niveau >= 10) {
            let x = Phaser.Math.Between(0, this.game.config.width);
            let dynamite = this.dynamites.create(x, 0, 'dynamite');
            dynamite.setVelocityY(Phaser.Math.Between(5, 10 + this.niveau * 2));
            dynamite.checkWorldBounds = true;
            dynamite.outOfBoundsKill = true;
        }
    },
    
    explodeDynamite: function(squelette, dynamite) {
        dynamite.disableBody(true, true);
    
        this.ames.children.each(function(ame) {
            if (ame.active) {
                ame.disableBody(true, true);
            }
        }, this);
    },

    // Fait tomber les âmes
    dropAme: function() {
        for(let i = 0; i < this.niveau; i++) {
            let x = Phaser.Math.Between(0, this.game.config.width);
            let ame = this.ames.create(x, 0, 'ame');
            ame.setVelocityY(Phaser.Math.Between(5, 10 + this.niveau * 2));
            ame.checkWorldBounds = true;
            ame.outOfBoundsKill = false;
            ame.setGravityY(0);
        }
    },

    update: function() {
        if (this.cursors.left.isDown) {
            this.squelette.setVelocityX(-50);
        } else if (this.cursors.right.isDown) {
            this.squelette.setVelocityX(50);
        } else {
            this.squelette.setVelocityX(0); // Arrête le mouvement latéral quand aucune touche n'est enfoncée
        }
        
        if (this.cursors.up.isDown && this.canJump) {
            this.squelette.setVelocityY(-100);
            this.endurance = Math.min(this.endurance + 2, this.enduranceMax);
            
            if (this.endurance === this.enduranceMax) {
                // Si l'endurance est au maximum, désactivez le saut
                this.canJump = false;
        
                // Réactivez le saut après une seconde
                this.time.delayedCall(1000, () => { this.canJump = true; });
        
                // Réduisez l'endurance pour que le joueur puisse récupérer
                this.endurance = Math.max(this.endurance - 2, 0);
            }
        } else {
            this.endurance = Math.max(this.endurance - 2, 0);
        }           
        
        // Créer la barre d'endurance
        this.enduranceBar.clear();
        this.enduranceBar.fillStyle(0xffffff, 1);
        this.enduranceBar.fillRect(0, this.game.config.height - 20, this.game.config.width * (this.endurance / this.enduranceMax), 20);


        this.physics.add.overlap(this.squelette, this.dynamites, this.explodeDynamite, null, this);

        this.physics.add.overlap(this.squelette, this.ames, this.collecterAme, null, this);
    
        this.ames.children.each(function(ame) {
            if (ame.active && ame.y > this.game.config.height) {
                ame.disableBody(true, true);
                this.score -= 1;
                this.scoreText.setText('Score: ' + this.score);
                // Recalculer le niveau
                this.niveau = Math.floor(this.score / 5) + 1;
                this.niveauText.setText('Niveau: ' + this.niveau);
            }
        }, this);
    },

    collecterAme: function(squelette, ame) {
        ame.disableBody(true, true);
    
        // Jouer le son
        this.sound.play('bruitageAme');
    
        this.score += 1;
        this.scoreText.setText('Score: ' + this.score);
    
        // Augmenter le niveau pour chaque tranche de 5 points
        if (this.score % 5 === 0) {
            this.niveau += 1;
            this.niveauText.setText('Niveau: ' + this.niveau);
        }
    }
});

// Scène de l'histoire
var SceneHistoire = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize:
    function SceneHistoire() {
        Phaser.Scene.call(this, { key: 'histoire' });
    },

    create: function() {
        var texteHistoire = "Vous êtes mort et après notre pacte, je vous rappelle que vous deviez toujours récupérer des âmes.";
        var texteFormate = this.add.text(50, 50, '', { fontSize: '14px', fill: '#fff', wordWrap: { width: 400 } });
        texteFormate.setText(texteHistoire);

        var boutonContinuer = this.add.text(200, 250, 'Continuer', { fontSize: '15px', fill: '#fff' })
            .setInteractive()
            .on('pointerdown', () => this.startGame());
    },

    startGame: function() {
        this.scene.start('jeu');  
    }
});

// Scène du menu principal
var MenuPrincipal = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function MenuPrincipal() {
        Phaser.Scene.call(this, { key: 'menu' });
    },

    preload: function() {
        this.load.audio('menuMusic', './Menu.m4a');
    },

    create: function() {
        var boutonJouer = this.add.text(210, 140, 'Jouer', { fontSize: '25px', fill: '#fff' })
            .setInteractive()
            .on('pointerdown', () => this.startHistoire());

        // Jouez la musique du menu ici
        this.menuMusic = this.sound.add('menuMusic');
        this.menuMusic.play({ loop: true });
    },

    startHistoire: function() {
        this.menuMusic.stop();
        this.scene.start('histoire');
    }
});

// Configuration du jeu
const config = {
    width: 500,
    height: 300,
    type: Phaser.AUTO,
    physics: {
        default: 'arcade',
        arcade: {},
    },
    scale: {
        parent: 'game-container',
    },
    scene: [MenuPrincipal, SceneHistoire, SceneDeJeu],
};

// Créer le jeu
var game = new Phaser.Game(config);