import './style.css'
import Phaser from 'phaser'
import GameScene from './scenes/GameScene.js'
import SplashScene from './scenes/SplashScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#111825',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [SplashScene, GameScene],
}

new Phaser.Game(config)
