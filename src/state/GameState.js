// GameState.js - core logic for Super Tris (Ultimate Tic-Tac-Toe)
// Pure JS (no Phaser), ES Modules. Keeps logic testable and separate from rendering.

export const EMPTY = ''
export const PLAYER_X = 'X'
export const PLAYER_O = 'O'
export const DRAW = 'D' // used for subgrid/main blocked cells (draw)

export class GameState {
  constructor(options = {}) {
    const { startingPlayer = PLAYER_X } = options
    this._initState(startingPlayer)
  }

  _initState(startingPlayer) {
    // main board tracks outcome of each subgrid: '', 'X', 'O', or 'D' (draw)
    this.main = Array.from({ length: 3 }, () => Array(3).fill(EMPTY))

    // sub grids: each has cells 3x3, winner (null | 'X' | 'O' | 'D'), movesCount
    this.sub = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => ({
        cells: Array.from({ length: 3 }, () => Array(3).fill(EMPTY)),
        winner: null,
        moves: 0,
      }))
    )

    this.currentPlayer = startingPlayer
    this.target = null // { row, col } for next required subgrid, or null for free choice
    this.winner = null // 'X' | 'O' | 'D' for global result, or null while playing
    this.lastMove = null // { mainR, mainC, r, c, player }

    // history for undo/redo (store snapshots)
    this._history = []
    this._future = []
  }

  newGame(options = {}) {
    const { startingPlayer = PLAYER_X } = options
    this._initState(startingPlayer)
    return this.getPublicState()
  }

  get isGameOver() {
    return this.winner !== null
  }

  getPublicState() {
    // Return a safe snapshot for UI
    return {
      main: this._clone2D(this.main),
      sub: this.sub.map(row => row.map(sg => ({
        cells: this._clone2D(sg.cells),
        winner: sg.winner,
        moves: sg.moves,
      }))),
      currentPlayer: this.currentPlayer,
      target: this.target ? { ...this.target } : null,
      winner: this.winner,
      validTargets: this.getValidTargets(),
      lastMove: this.lastMove ? { ...this.lastMove } : null,
    }
  }

  // Helpers
  _clone2D(arr) {
    return arr.map(row => row.slice())
  }

  _snapshot() {
    return JSON.stringify({
      main: this.main,
      sub: this.sub,
      currentPlayer: this.currentPlayer,
      target: this.target,
      winner: this.winner,
      lastMove: this.lastMove,
    })
  }

  _restore(snapshotStr) {
    const s = JSON.parse(snapshotStr)
    // deep clone to detach references
    this.main = this._clone2D(s.main)
    this.sub = s.sub.map(row => row.map(sg => ({
      cells: this._clone2D(sg.cells),
      winner: sg.winner,
      moves: sg.moves,
    })))
    this.currentPlayer = s.currentPlayer
    this.target = s.target
    this.winner = s.winner
    this.lastMove = s.lastMove || null
  }

  undo() {
    if (this._history.length === 0) return false
    const curr = this._snapshot()
    this._future.push(curr)
    const prev = this._history.pop()
    this._restore(prev)
    return true
  }

  redo() {
    if (this._future.length === 0) return false
    const curr = this._snapshot()
    this._history.push(curr)
    const next = this._future.pop()
    this._restore(next)
    return true
  }

  // Determine playable subgrids for the current move
  getValidTargets() {
    if (this.isGameOver) return []
    // if target is set and playable, only that one
    if (this.target && this._isSubgridPlayable(this.target.row, this.target.col)) {
      return [{ row: this.target.row, col: this.target.col }]
    }
    // else any playable
    const targets = []
    for (let R = 0; R < 3; R++) {
      for (let C = 0; C < 3; C++) {
        if (this._isSubgridPlayable(R, C)) targets.push({ row: R, col: C })
      }
    }
    return targets
  }

  // Determine if a specific move is legal
  isMoveAllowed(mainR, mainC, r, c) {
    if (this.isGameOver) return { ok: false, reason: 'Partita terminata' }
    if (!this._inRange(mainR) || !this._inRange(mainC) || !this._inRange(r) || !this._inRange(c)) {
      return { ok: false, reason: 'Coordinate fuori griglia' }
    }

    const sg = this.sub[mainR][mainC]
    // Block only if subgrid is not playable (full or DRAW), not simply because it has an owner
    if (!this._isSubgridPlayable(mainR, mainC)) return { ok: false, reason: 'Sottogriglia non disponibile' }
    if (sg.cells[r][c] !== EMPTY) return { ok: false, reason: 'Casella occupata' }

    // target rule
    const targetPlayable = this.target && this._isSubgridPlayable(this.target.row, this.target.col)
    if (targetPlayable) {
      if (mainR !== this.target.row || mainC !== this.target.col) {
        return { ok: false, reason: 'Devi giocare nella sottogriglia evidenziata' }
      }
    } else {
      // target blocked or not set: any playable subgrid is fine
      // already checked playability above
    }

    return { ok: true }
  }

  // Returns list of valid moves for highlighting: [{mainR, mainC, r, c}]
  getValidMoves() {
    const moves = []
    if (this.isGameOver) return moves

    const targets = this.getValidTargets()
    const allowed = new Set(targets.map(t => `${t.row},${t.col}`))

    for (let MR = 0; MR < 3; MR++) {
      for (let MC = 0; MC < 3; MC++) {
        const key = `${MR},${MC}`
        if (!allowed.has(key)) continue
        const sg = this.sub[MR][MC]
        if (!this._isSubgridPlayable(MR, MC)) continue
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (sg.cells[r][c] === EMPTY) moves.push({ mainR: MR, mainC: MC, r, c })
          }
        }
      }
    }
    return moves
  }

  // Apply a move if allowed. Returns a result object with updated public state.
  play(mainR, mainC, r, c) {
    const allowed = this.isMoveAllowed(mainR, mainC, r, c)
    if (!allowed.ok) {
      return { ok: false, reason: allowed.reason, state: this.getPublicState() }
    }

    // snapshot for undo
    this._history.push(this._snapshot())
    this._future = []

    const sg = this.sub[mainR][mainC]
    sg.cells[r][c] = this.currentPlayer
    sg.moves += 1

    // Track last move for UI highlighting
    this.lastMove = { mainR, mainC, r, c, player: this.currentPlayer }

    // Check subgrid win/draw
    const won = this._checkThreeInRow(sg.cells, this.currentPlayer)
    if (won) {
      // New tris always assigns/flip ownership to the current player
      sg.winner = this.currentPlayer
      this.main[mainR][mainC] = this.currentPlayer
    } else if (sg.moves === 9) {
      // On full subgrid: if any tris exists, keep/assign ownership; otherwise, mark DRAW
      const xWin = this._checkThreeInRow(sg.cells, PLAYER_X)
      const oWin = this._checkThreeInRow(sg.cells, PLAYER_O)
      if (xWin || oWin) {
        if (!sg.winner) {
          sg.winner = xWin && !oWin ? PLAYER_X : (!xWin && oWin ? PLAYER_O : sg.winner)
        }
        if (sg.winner === PLAYER_X || sg.winner === PLAYER_O) {
          this.main[mainR][mainC] = sg.winner
        }
      } else {
        sg.winner = DRAW
        this.main[mainR][mainC] = DRAW // mark blocked
      }
    }

    // Check global win/draw on main board
    const mainWinner = this._checkThreeInRow(this._mainAsCells(), PLAYER_X) ? PLAYER_X
                      : this._checkThreeInRow(this._mainAsCells(), PLAYER_O) ? PLAYER_O
                      : null

    if (mainWinner) {
      this.winner = mainWinner
      this.target = null
      return { ok: true, state: this.getPublicState(), event: 'win', winner: mainWinner }
    }

    const allMainFilled = this._allMainResolved()
    if (allMainFilled) {
      this.winner = DRAW
      this.target = null
      return { ok: true, state: this.getPublicState(), event: 'draw' }
    }

    // Set next target via addressing rule
    const nextR = r
    const nextC = c
    if (this._isSubgridPlayable(nextR, nextC)) {
      this.target = { row: nextR, col: nextC }
    } else {
      // free choice if target is blocked
      this.target = null
    }

    // switch player
    this.currentPlayer = this.currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X

    return { ok: true, state: this.getPublicState(), event: 'move' }
  }

  // Utility: build 3x3 cells representing main board for win check (X/O only)
  _mainAsCells() {
    const cells = Array.from({ length: 3 }, () => Array(3).fill(EMPTY))
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const v = this.main[r][c]
        cells[r][c] = v === PLAYER_X || v === PLAYER_O ? v : EMPTY
      }
    }
    return cells
  }

  _allMainResolved() {
    // Global draw only if no subgrid is playable anymore (i.e., all full or DRAW)
    for (let R = 0; R < 3; R++) {
      for (let C = 0; C < 3; C++) {
        if (this._isSubgridPlayable(R, C)) return false
      }
    }
    return true
  }

  _inRange(n) { return Number.isInteger(n) && n >= 0 && n < 3 }

  _isSubgridPlayable(R, C) {
    const sg = this.sub[R][C]
    // Play is allowed until the subgrid is full; DRAW blocks further play.
    return sg.moves < 9 && sg.winner !== DRAW
  }

  _checkThreeInRow(cells, player) {
    // cells: 3x3 array; player: 'X'|'O'
    // rows/cols
    for (let i = 0; i < 3; i++) {
      if (cells[i][0] === player && cells[i][1] === player && cells[i][2] === player) return true
      if (cells[0][i] === player && cells[1][i] === player && cells[2][i] === player) return true
    }
    // diagonals
    if (cells[0][0] === player && cells[1][1] === player && cells[2][2] === player) return true
    if (cells[0][2] === player && cells[1][1] === player && cells[2][0] === player) return true
    return false
  }

  // Convenience message for HUD
  getStatusMessage() {
    if (this.isGameOver) {
      if (this.winner === DRAW) return 'Pareggio!'
      return `Vittoria di ${this.winner}!`
    }
    const who = this.currentPlayer === PLAYER_X ? 'X' : 'O'
    if (this.target && this._isSubgridPlayable(this.target.row, this.target.col)) {
      return `Turno: ${who} — gioca nella sottogriglia (${this.target.row + 1},${this.target.col + 1})`
    }
    return `Turno: ${who} — scegli una sottogriglia qualunque disponibile`
  }

  // Debug util: compact representation of main board
  mainToString() {
    return this.main.map(r => r.map(v => (v || '.')).join(' ')).join('\n')
  }
}
