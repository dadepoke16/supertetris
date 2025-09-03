# Super Tris (Ultimate Tic‑Tac‑Toe) — Phaser 3 + Vite

Un prototipo giocabile in browser del gioco Super Tris (variante del tris, noto anche come Ultimate Tic‑Tac‑Toe) sviluppato con Phaser 3 e JavaScript (ES Modules). Toolchain minima con Vite; nessuna dipendenza grafica extra oltre Phaser.

Giocabile localmente in hot‑seat: due giocatori X e O (X inizia sempre).

## Demo locale (sviluppo)

Prerequisiti: Node.js >= 18

1. Installazione dipendenze
   
   ```bash
   npm install
   ```

2. Avvio in sviluppo
   
   ```bash
   npm run dev
   ```
   
   Vite aprirà il browser su un URL locale. Dovresti vedere la griglia 3×3 di sottogriglie 3×3. Gioca con mouse o touch.

3. Build di produzione
   
   ```bash
   npm run build
   ```
   
   L’output finisce in `dist/`.

4. Anteprima build
   
   ```bash
   npm run preview
   ```

## Regole del gioco (Super Tris)
- Griglia principale 3×3; ogni cella contiene un mini‑tris 3×3.
- Due giocatori locali: X (inizia sempre) e O.
- Regola di indirizzamento: la casella piccola in cui giochi (riga/colonna) determina la sottogriglia in cui l’avversario dovrà giocare al turno successivo.
- Conquista di una sottogriglia: facendo tris in un mini‑tris, la relativa cella della griglia principale viene conquistata (overlay X/O grande).
- Pareggio di sottogriglia: se il mini‑tris è pieno senza tris, la cella grande resta bloccata (mostrata con tratteggio).
- Target bloccato: se la sottogriglia bersaglio è già conquistata o piena, si può giocare in qualunque sottogriglia disponibile.
- Vittoria: vince chi completa un tris sulla griglia principale.

## UI/UX
- Evidenzia in arancione la sottogriglia target e le mosse valide.
- HUD con turno corrente, pulsanti: Nuova partita, Undo, Redo, Regole.
- Overlay X/O grande su sottogriglie conquistate e pattern tratteggiato per pareggi.
- Banner finale con vincitore o pareggio.
- Responsivo: scala in 16:9, funziona su desktop e mobile (mouse/touch).

## Struttura del codice
```
src/
  main.js              // bootstrap Phaser + scaling responsivo
  style.css            // stile base (importato da main.js)
  scenes/
    GameScene.js       // rendering, input, HUD, highlight, overlay
  state/
    GameState.js       // logica di gioco pura/testabile (nessun Phaser)
```

- Logica separata dalla grafica: la classe `GameState` gestisce turni, validazione mosse, indirizzamento, vittorie/pareggi, undo/redo.

## Deploy pubblico
Puoi pubblicare facilmente su GitHub Pages, Netlify o Vercel.

### GitHub Pages (consigliato, con workflow)
1. Assicurati di avere il repository su GitHub e il branch `main`.
2. Questo progetto include un workflow GitHub Actions (`.github/workflows/deploy-gh-pages.yml`).
3. Su GitHub, vai nelle impostazioni del repo: Settings → Pages → Build and deployment → Source: GitHub Actions.
4. Ogni push su `main` costruirà e pubblicherà automaticamente la cartella `dist` su GitHub Pages. L’URL sarà del tipo `https://<utente>.github.io/<repo>/`.

Nota: Nel file `vite.config.js` la proprietà `base` è impostata a `./` per avere asset relativi e semplificare il deploy su Pages e hosting statici.

### Netlify
- Opzione A (drag‑and‑drop): esegui `npm run build` e trascina la cartella `dist/` su https://app.netlify.com/drop
- Opzione B (da repository):
  - Site settings → Build & Deploy: Build command `npm run build`, Publish directory `dist`.
  - Framework preset: non necessario.

### Vercel
- Importa il repository su https://vercel.com/import
- Build Command: `npm run build`
- Output Directory: `dist`
- Node 18+.

## Testabilità
- La logica del gioco è isolata in `src/state/GameState.js` e può essere testata con test unitari (non inclusi) senza Phaser o DOM.

## Extra opzionali realizzati
- Undo/Redo mosse (pulsanti nell’HUD).

## Licenza
MIT (se desideri un’altra licenza, modifica questo file).
