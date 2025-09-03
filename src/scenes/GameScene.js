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

import Phaser from 'phaser'
import { GameState, PLAYER_X, PLAYER_O, DRAW } from '../state/GameState.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create() {
    // Core state
    this.state = new GameState({ startingPlayer: PLAYER_X })

    // Layout calculations
    this.ui = {}
    this._computeLayout()

    // Graphics layers
    this.gridGfx = this.add.graphics()
    this.highlightGfx = this.add.graphics()
    this.overlayGfx = this.add.graphics()
    // Ensure highlight layer is above marks and overlays
    this.gridGfx.setDepth(100)
    this.overlayGfx.setDepth(200)
    this.highlightGfx.setDepth(1005)

    // Build interactive cells and texts
    this._buildBoard()

    // HUD and Buttons
    this._buildHUD()

    // Initial render
    this._renderAll()

    // Handle resize
    this.scale.on('resize', () => {
      this._computeLayout()
      this._layoutBoard()
      this._layoutHUD()
      this._renderAll()
    })
  }

  // ---------- Layout ----------
  _computeLayout() {
    const w = this.scale.gameSize.width
    const h = this.scale.gameSize.height
    const margin = Math.floor(Math.min(w, h) * 0.04)
    const boardSize = Math.min(w, h) - margin * 2
    const cellGap = Math.floor(boardSize * 0.01)

    this.layout = {
      w, h, margin, boardSize, cellGap,
      originX: Math.floor((w - boardSize) / 2),
      originY: Math.floor((h - boardSize) / 2) + Math.floor(h * 0.03), // a little lower to leave room for HUD
    }

    this.layout.subgridSize = Math.floor(boardSize / 3)
    this.layout.cellSize = Math.floor(this.layout.subgridSize / 3)
  }

  _buildBoard() {
    const { cellSize } = this.layout

    // data structures
    this.cells = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null))
      )
    )

    this.smallMarks = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null))
      )
    )

    this.bigMarks = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null))

    // Create interactive rectangles for every small cell
    for (let MR = 0; MR < 3; MR++) {
      for (let MC = 0; MC < 3; MC++) {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const { x, y } = this._cellCenter(MR, MC, r, c)
            const rect = this.add.rectangle(x, y, cellSize - 6, cellSize - 6, 0x00ff88, 0.08)
            rect.setStrokeStyle(1, 0x00ff88, 0.3)
            rect.setInteractive({ useHandCursor: true })
            rect.on('pointerover', () => this._onHoverCell(MR, MC, r, c, true))
            rect.on('pointerout', () => this._onHoverCell(MR, MC, r, c, false))
            rect.on('pointerdown', () => this._onClickCell(MR, MC, r, c))
            this.cells[MR][MC][r][c] = rect
          }
        }
      }
    }

    this._layoutBoard()
  }

  _layoutBoard() {
    const { cellSize } = this.layout
    for (let MR = 0; MR < 3; MR++) {
      for (let MC = 0; MC < 3; MC++) {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const rect = this.cells[MR][MC][r][c]
            const { x, y } = this._cellCenter(MR, MC, r, c)
            rect.setPosition(x, y)
            rect.setSize(cellSize - 6, cellSize - 6)
            const mark = this.smallMarks[MR][MC][r][c]
            if (mark) mark.setPosition(x, y).setFontSize(Math.floor(cellSize * 0.6))
          }
        }
        const big = this.bigMarks[MR][MC]
        if (big) {
          const { x, y } = this._subgridCenter(MR, MC)
          big.setPosition(x, y).setFontSize(Math.floor(this.layout.subgridSize * 0.8))
        }
      }
    }
  }

  _buildHUD() {
    const topPad = 20
    const leftPad = this.layout.originX

    // Status text stays near the board's top-left
    this.ui.statusText = this.add.text(leftPad, topPad, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '24px',
      color: '#ffffff'
    })
    this.ui.statusText.setDepth(1100)

    // Create a compact menu icon (hamburger) in the top-left of the canvas
    this.ui.menuIcon = this._createIconButton(12, 12, () => this._toggleMenu())
    this.ui.menuIcon.setDepth(1100)

    // Create a panel that will hold the action buttons (hidden by default)
    this.ui.menuPanel = this.add.container(0, 0)
    const panelW = 164
    const panelPad = 8
    const panelBg = this.add.rectangle(0, 0, panelW, 10, 0x0f172a, 0.96).setOrigin(0, 0)
    panelBg.setStrokeStyle(2, 0x5eead4)
    this.ui.menuPanel.add(panelBg)

    // Buttons inside the panel
    const btns = []
    btns.push(this._createButton(panelW - 12, panelPad + 8, 'Nuova partita', () => this._newGame()))
    btns.push(this._createButton(panelW - 12, 0, 'Undo', () => this._undo()))
    btns.push(this._createButton(panelW - 12, 0, 'Redo', () => this._redo()))
    btns.push(this._createButton(panelW - 12, 0, 'Regole', () => this._toggleRules()))
    this.ui.buttons = btns
    // Stack buttons vertically inside panel
    let by = panelPad + 8
    for (const b of btns) {
      b.setPosition(panelW - 12, by)
      by += b.height + 6
      this.ui.menuPanel.add(b)
    }
    // Resize panel background to fit buttons
    panelBg.width = panelW
    panelBg.height = by + panelPad

    this.ui.menuPanel.setVisible(false)
    this.ui.menuPanel.setDepth(1100)

    // Rules panel (hidden by default)
    this.ui.rulesPanel = this._createRulesPanel()
    this.ui.rulesPanel.setVisible(false)
    this.ui.rulesPanel.setDepth(1200)

    // Final banner
    this.ui.finalBanner = this._createFinalBanner()
    this.ui.finalBanner.setVisible(false)
    this.ui.finalBanner.setDepth(1300)

    this._layoutHUD()
  }

  _layoutHUD() {
    const top = 12

    // Status text positioned at left top of the board area
    this.ui.statusText.setPosition(this.layout.originX, top)

    // Menu icon at the screen top-left
    this.ui.menuIcon.setPosition(12, 12)

    // Place the menu panel just below the icon, keep on-screen
    const panelX = 12
    const panelY = 12 + this.ui.menuIcon.height + 8
    this.ui.menuPanel.setPosition(panelX, panelY)

    // Center rules panel and final banner
    const centerX = this.layout.w / 2
    const centerY = this.layout.h / 2
    this.ui.rulesPanel.setPosition(centerX, centerY)
    this.ui.finalBanner.setPosition(centerX, centerY)
  }

  _createButton(x, y, label, onClick) {
    const width = 140
    const height = 36
    const container = this.add.container(x, y)
    const bg = this.add.rectangle(0, 0, width, height, 0x2b3548, 1).setOrigin(1, 0)
    bg.setStrokeStyle(2, 0x5eead4)
    const txt = this.add.text(-width + 12, 8, label, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '16px',
      color: '#e5e7eb'
    }).setOrigin(0, 0)
    container.add([bg, txt])
    container.setSize(width, height)
    container.setInteractive(new Phaser.Geom.Rectangle(-width, 0, width, height), Phaser.Geom.Rectangle.Contains)
    container.on('pointerdown', onClick)
    container.on('pointerover', () => bg.setFillStyle(0x334155))
    container.on('pointerout', () => bg.setFillStyle(0x2b3548))
    container.width = width
    container.height = height
    return container
  }

  _createIconButton(x, y, onClick) {
    const size = 40
    const container = this.add.container(x, y)
    const bg = this.add.rectangle(0, 0, size, size, 0x1f2937, 1).setOrigin(0, 0)
    bg.setStrokeStyle(2, 0x5eead4)
    // hamburger lines
    const line1 = this.add.rectangle(8, 12, size - 16, 3, 0xe5e7eb, 1).setOrigin(0, 0.5)
    const line2 = this.add.rectangle(8, 20, size - 16, 3, 0xe5e7eb, 1).setOrigin(0, 0.5)
    const line3 = this.add.rectangle(8, 28, size - 16, 3, 0xe5e7eb, 1).setOrigin(0, 0.5)
    container.add([bg, line1, line2, line3])

    container.setSize(size, size)
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains)
    container.on('pointerdown', onClick)
    container.on('pointerover', () => bg.setFillStyle(0x273244))
    container.on('pointerout', () => bg.setFillStyle(0x1f2937))
    container.width = size
    container.height = size
    return container
  }

  _toggleMenu() {
    const newVisible = !this.ui.menuPanel.visible
    this.ui.menuPanel.setVisible(newVisible)
  }

  _createRulesPanel() {
    const w = Math.min(520, Math.floor(this.layout.w * 0.9))
    const h = Math.min(360, Math.floor(this.layout.h * 0.8))
    const container = this.add.container(this.layout.w / 2, this.layout.h / 2)
    const bg = this.add.rectangle(0, 0, w, h, 0x0f172a, 0.95).setOrigin(0.5)
    bg.setStrokeStyle(2, 0x5eead4)

    const title = this.add.text(0, -h / 2 + 16, 'Regole — Super Tris', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5, 0)

    const text = this.add.text(-w / 2 + 16, -h / 2 + 48,
      '• Due giocatori: X inizia sempre.\n' +
      '• Ogni cella grande contiene un mini-tris.\n' +
      '• La tua mossa determina la sottogriglia bersaglio del tuo avversario (coordinate della casella piccola → sottogriglia).\n' +
      '• Conquista una sottogriglia facendo tris: quella cella grande diventa tua.\n' +
      '• Se fai tris in una sottogriglia già conquistata dall’avversario, la proprietà della cella grande si ribalta e passa a te. È possibile continuare a giocare nelle sottogriglie conquistate finché non sono piene.\n' +
      '• Se il mini-tris pareggia, la cella grande resta bloccata.\n' +
      '• Vince chi fa tris nella griglia principale.\n' +
      '\n' +
      'Questo gioco è stato creato da Davide Gatta (DadePoke16).\n' +
      '\n'  ,
      { fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial', fontSize: '16px', color: '#e5e7eb', wordWrap: { width: w - 32 } }
    ).setOrigin(0, 0)

    const close = this._createButton(w / 2 - 12, -h / 2 + 8, 'Chiudi', () => this._toggleRules())
    container.add([bg, title, text, close])

    return container
  }

  _createFinalBanner() {
    const w = Math.min(480, Math.floor(this.layout.w * 0.9))
    const h = 160
    const container = this.add.container(this.layout.w / 2, this.layout.h / 2)
    const bg = this.add.rectangle(0, 0, w, h, 0x0f172a, 0.9).setOrigin(0.5)
    bg.setStrokeStyle(2, 0xf59e0b)

    const title = this.add.text(0, -28, 'Partita terminata', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial', fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5)

    this.ui.finalMsg = this.add.text(0, 10, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial', fontSize: '26px', color: '#e5e7eb'
    }).setOrigin(0.5)

    const again = this._createButton(w / 2 - 12, h / 2 - 44, 'Nuova partita', () => this._newGame())
    container.add([bg, title, this.ui.finalMsg, again])

    return container
  }

  _toggleRules() {
    const v = !this.ui.rulesPanel.visible
    this.ui.rulesPanel.setVisible(v)
  }

  _newGame() {
    this.state.newGame({ startingPlayer: PLAYER_X })
    this.ui.finalBanner.setVisible(false)
    this._renderAll()
  }

  _undo() {
    if (this.state.undo()) this._renderAll()
  }
  _redo() {
    if (this.state.redo()) this._renderAll()
  }

  // ---------- Rendering ----------
  _renderAll() {
    const pub = this.state.getPublicState()

    // Update HUD
    this.ui.statusText.setText(this.state.getStatusMessage())

    // Clear graphics
    this.gridGfx.clear()
    this.highlightGfx.clear()
    this.overlayGfx.clear()

    // Draw board grid lines
    this._drawGrids()

    // Draw big marks (won subgrids) and draw overlays
    for (let MR = 0; MR < 3; MR++) {
      for (let MC = 0; MC < 3; MC++) {
        const cell = pub.main[MR][MC]
        const center = this._subgridCenter(MR, MC)
        // Update/create big mark texts
        if (cell === PLAYER_X || cell === PLAYER_O) {
          this._setBigMark(MR, MC, cell)
        } else {
          this._setBigMark(MR, MC, null)
          if (cell === DRAW) {
            // hatch overlay for draw
            this._drawHatchSubgrid(MR, MC)
          }
        }

        // Draw small marks inside subgrids
        const sg = pub.sub[MR][MC]
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const v = sg.cells[r][c]
            this._setSmallMark(MR, MC, r, c, v === '' ? null : v)
          }
        }
      }
    }

    // Highlight target subgrid and valid moves
    const targets = pub.validTargets
    for (const t of targets) {
      this._emphasizeSubgrid(t.row, t.col, 0xf59e0b)
    }

    const validMoves = this.state.getValidMoves()
    const allowed = new Set(validMoves.map(m => `${m.mainR}${m.mainC}${m.r}${m.c}`))

    for (let MR = 0; MR < 3; MR++) {
      for (let MC = 0; MC < 3; MC++) {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const rect = this.cells[MR][MC][r][c]
            const key = `${MR}${MC}${r}${c}`
            const can = allowed.has(key)
            rect.setAlpha(can ? 0.12 : 0.03)
            rect.setInteractive({ useHandCursor: can })
            rect.input && (rect.input.enabled = can)
          }
        }
      }
    }

    // Last move halo
    if (pub.lastMove) {
      const lm = pub.lastMove
      this._drawLastMoveHalo(lm.mainR, lm.mainC, lm.r, lm.c, lm.player)
    }

    // Final banner if game over
    if (this.state.isGameOver) {
      const winner = this.state.winner
      this.ui.finalMsg.setText(winner === DRAW ? 'Pareggio!' : `Vince ${winner}!`)
      this.ui.finalBanner.setVisible(true)
    }
  }

  _drawGrids() {
    const g = this.gridGfx
    const { originX, originY, boardSize, subgridSize, cellSize } = this.layout

    // Outer border
    g.lineStyle(6, 0xffffff, 0.8)
    g.strokeRect(originX, originY, boardSize, boardSize)

    // Main 3x3 lines (thick)
    g.lineStyle(6, 0xffffff, 0.8)
    for (let i = 1; i <= 2; i++) {
      // vertical
      g.strokeLineShape(new Phaser.Geom.Line(originX + i * subgridSize, originY, originX + i * subgridSize, originY + boardSize))
      // horizontal
      g.strokeLineShape(new Phaser.Geom.Line(originX, originY + i * subgridSize, originX + boardSize, originY + i * subgridSize))
    }

    // Subgrid inner lines (thin)
    g.lineStyle(2, 0x94a3b8, 0.6)
    for (let MR = 0; MR < 3; MR++) {
      for (let MC = 0; MC < 3; MC++) {
        const sx = originX + MC * subgridSize
        const sy = originY + MR * subgridSize
        for (let i = 1; i <= 2; i++) {
          g.strokeLineShape(new Phaser.Geom.Line(sx + i * cellSize, sy, sx + i * cellSize, sy + subgridSize))
          g.strokeLineShape(new Phaser.Geom.Line(sx, sy + i * cellSize, sx + subgridSize, sy + i * cellSize))
        }
      }
    }
  }

  _strokeSubgrid(MR, MC, color, thickness = 3, alpha = 1) {
    const { originX, originY, subgridSize } = this.layout
    const x = originX + MC * subgridSize
    const y = originY + MR * subgridSize
    this.highlightGfx.lineStyle(thickness, color, alpha)
    this.highlightGfx.strokeRect(x + 2, y + 2, subgridSize - 4, subgridSize - 4)
  }

  // Strong emphasis for a target subgrid: soft fill + thick outline
  _emphasizeSubgrid(MR, MC, color) {
    const { originX, originY, subgridSize } = this.layout
    const x = originX + MC * subgridSize
    const y = originY + MR * subgridSize
    // soft fill slightly inside the cell using overlay layer (tints content)
    this.overlayGfx.fillStyle(color, 0.08)
    this.overlayGfx.fillRect(x + 3, y + 3, subgridSize - 6, subgridSize - 6)
    // thick outline on highlight layer
    this.highlightGfx.lineStyle(8, color, 1)
    this.highlightGfx.strokeRect(x + 2, y + 2, subgridSize - 4, subgridSize - 4)
  }

  _drawHatchSubgrid(MR, MC) {
    const { originX, originY, subgridSize } = this.layout
    const x = originX + MC * subgridSize
    const y = originY + MR * subgridSize
    const g = this.overlayGfx
    g.fillStyle(0x64748b, 0.1)
    g.fillRect(x + 4, y + 4, subgridSize - 8, subgridSize - 8)
    g.lineStyle(2, 0x64748b, 0.5)
    for (let i = 0; i <= subgridSize; i += 12) {
      g.strokeLineShape(new Phaser.Geom.Line(x + i, y, x, y + i))
      g.strokeLineShape(new Phaser.Geom.Line(x + subgridSize, y + i, x + i, y + subgridSize))
    }
  }

  _drawLastMoveHalo(MR, MC, r, c, player) {
    const { x, y } = this._cellCenter(MR, MC, r, c)
    const radius = Math.max(8, Math.floor(this.layout.cellSize * 0.42))
    const color = player === 'X' ? 0x22d3ee : 0xf472b6
    // Outer colored ring
    this.highlightGfx.lineStyle(8, color, 0.95)
    this.highlightGfx.strokeCircle(x, y, radius)
    // Inner white ring for contrast
    this.highlightGfx.lineStyle(2, 0xffffff, 0.85)
    this.highlightGfx.strokeCircle(x, y, Math.max(4, radius - 5))
  }

  _setSmallMark(MR, MC, r, c, val) {
    const prev = this.smallMarks[MR][MC][r][c]
    if (!val) {
      if (prev) { prev.destroy(); this.smallMarks[MR][MC][r][c] = null }
      return
    }
    const { x, y } = this._cellCenter(MR, MC, r, c)
    if (prev) {
      prev.setText(val)
      prev.setPosition(x, y)
      return
    }
    const mark = this.add.text(x, y, val, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: Math.floor(this.layout.cellSize * 0.6) + 'px',
      color: val === 'X' ? '#22d3ee' : '#f472b6'
    }).setOrigin(0.5)
    this.smallMarks[MR][MC][r][c] = mark
  }

  _setBigMark(MR, MC, val) {
    const prev = this.bigMarks[MR][MC]
    if (!val) {
      if (prev) { prev.destroy(); this.bigMarks[MR][MC] = null }
      return
    }
    const { x, y } = this._subgridCenter(MR, MC)
    if (prev) {
      prev.setText(val).setPosition(x, y)
      // Ensure color reflects current owner (flip supported)
      prev.setStyle({ color: val === 'X' ? '#22d3ee' : '#f472b6', fontStyle: 'bold' })
      prev.setAlpha(0.9)
      return
    }
    const mark = this.add.text(x, y, val, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: Math.floor(this.layout.subgridSize * 0.8) + 'px',
      color: val === 'X' ? '#22d3ee' : '#f472b6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.9)
    this.bigMarks[MR][MC] = mark
  }

  // ---------- Input ----------
  _onHoverCell(MR, MC, r, c, inside) {
    const rect = this.cells[MR][MC][r][c]
    if (!rect.input || !rect.input.enabled) return
    rect.setStrokeStyle(inside ? 3 : 1, 0x00ff88, inside ? 1 : 0.3)
  }

  _onClickCell(MR, MC, r, c) {
    const res = this.state.play(MR, MC, r, c)
    if (!res.ok) {
      // Mossa non valida: semplicemente ignora
      return
    }
    this._renderAll()
  }

  // ---------- Geometry helpers ----------
  _subgridTopLeft(MR, MC) {
    const { originX, originY, subgridSize } = this.layout
    return { x: originX + MC * subgridSize, y: originY + MR * subgridSize }
  }

  _subgridCenter(MR, MC) {
    const { x, y } = this._subgridTopLeft(MR, MC)
    const { subgridSize } = this.layout
    return { x: x + subgridSize / 2, y: y + subgridSize / 2 }
  }

  _cellCenter(MR, MC, r, c) {
    const { x, y } = this._subgridTopLeft(MR, MC)
    const { cellSize } = this.layout
    const cx = x + c * cellSize + cellSize / 2
    const cy = y + r * cellSize + cellSize / 2
    return { x: cx, y: cy }
  }
}
