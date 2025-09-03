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

import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // makes it easy to deploy to GitHub Pages subpath
  server: {
    open: true
  }
})
