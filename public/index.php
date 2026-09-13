<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sudoku Studio</title>
  <link rel="stylesheet" href="style.css">
  <script src="deductions.js" defer></script>
  <script src="app.js" defer></script>
</head>
<body>
<main>
  <header><span class="eyebrow">A LITTLE DAILY LOGIC</span><h1>Sudoku<span> Studio</span></h1>
    <p>Nine numbers. One solution. Take your time.</p></header>
  <div class="layout">
    <section class="play" aria-label="Sudoku puzzle">
      <div class="board-meta"><strong id="puzzle-label">Your next puzzle</strong><span id="progress">0 / 81 filled</span></div>
      <div id="board" role="group" aria-label="Sudoku grid"></div>
      <p class="board-tip">Click a small number to fill its cell. Select a filled cell and use Erase to change it.</p>
      <div class="actions"><label class="toggle crossout-toggle"><input type="checkbox" id="eliminate-mode"> Cross out</label><button id="erase">Erase</button><button id="undo">Undo</button></div>
      <p class="board-tip">Cross out mode: click a candidate to mark or restore it. Right-click always works. Bold candidates are naked singles.</p>
    </section>
    <aside>
      <section class="card"><span class="eyebrow">FIND YOUR PACE</span><h2>Make it your puzzle.</h2>
        <label for="difficulty">Difficulty</label>
        <select id="difficulty"><option value="easy">01 · Easy</option><option value="medium">02 · Medium</option><option value="hard">03 · Hard</option><option value="expert">04 · Expert</option><option value="master">05 · Master</option></select>
        <p id="level-description">A gentle start with plenty of clues.</p>
        <button class="primary" id="new-game">Generate puzzle <span aria-hidden="true">↗</span></button>
        <div class="divider"></div>
        <button id="check">Check answers</button><button id="hint">Reveal one cell</button><button id="reset">Restart puzzle</button>
        <button id="show-deduction">Pair and triple help</button>
        <button id="clear-crossouts" disabled>Clear cross-outs</button>
        <p id="deduction-text" role="status" aria-live="polite">Choose Pair and triple help to look for a deduction.</p>
        <p id="status" role="status" aria-live="polite">Choose a difficulty to get started.</p>
        <div class="divider"></div>
        <label for="highlight-number">Highlight matching numbers</label>
        <select id="highlight-number"><option value="0">Hover a candidate, or choose…</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option></select>
        <label class="toggle zoom-toggle"><input type="checkbox" id="large-mode"> Enlarge selected cell</label>
      </section>

      <section class="help"><h3>A few simple rules</h3><p>Fill each row, column, and 3 × 3 box with 1–9, using each number once.</p>
        <p><strong>Candidates:</strong> each empty cell shows numbers allowed by the current row, column, and box. Click one to choose it. These are possibilities, not guaranteed answers.</p>
        <p><strong>Keyboard:</strong> arrow keys move, 1–9 enter a number, and Backspace clears. Candidates update automatically.</p>
        <p class="fine">Every puzzle has exactly one solution. Difficulty is estimated from clues, singles, and solver search effort; human solving difficulty may vary.</p>
      </section>
    </aside>
  </div>
  <footer>Made with PHP, JavaScript & CSS · No accounts. Just logic.</footer>
</main>
</body>
</html>
