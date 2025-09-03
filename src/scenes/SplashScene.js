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

/*
 * Xeader Studios
 *
 * SplashScene: shows a splash image for 5 seconds at startup
 */

import Phaser from 'phaser'

// Resolve the image URL via Vite's bundling
const SPLASH_URL = new URL('../img/splash.png', import.meta.url).toString()

export default class SplashScene extends Phaser.Scene {
  constructor() { super('SplashScene') }

  preload() {
    this.load.image('splash', SPLASH_URL)
  }

  create() {
    // background color to match app
    this.cameras.main.setBackgroundColor('#111825')

    this.image = this.add.image(0, 0, 'splash')
    this.image.setOrigin(0.5)

    // Center and scale to fit
    this._layout()

    // Re-layout on resize
    this.scale.on('resize', () => this._layout())

    // After 5 seconds, go to GameScene
    this.time.delayedCall(3000, () => this.scene.start('GameScene'))

    // Allow click/tap to skip the wait
    this.input.once('pointerdown', () => this.scene.start('GameScene'))
  }

  _layout() {
    const w = this.scale.gameSize.width
    const h = this.scale.gameSize.height

    this.image.setPosition(w / 2, h / 2)

    // Scale the image to fit within the viewport while preserving aspect ratio
    const iw = this.image.width
    const ih = this.image.height
    if (iw && ih) {
      const scale = Math.min((w * 0.95) / iw, (h * 0.95) / ih)
      this.image.setScale(scale)
    }
  }
}
