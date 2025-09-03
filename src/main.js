/*
 * Xeader Studios
 *
 * NOTICE OF LICENCE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt
 * It is also available through th world-wide-web at this URL:
 * https://xeader.com/LICENCE-CE.txt
 *
 * @category supertris
 * @package supertris
 *
 * @author Antonio Gatta <a.gatta@xeader.com>
 * @url http://xeader.com
 * @copyright Copyright (c) 2025 Xeader Studios
 * @license All right reserved
 */

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
