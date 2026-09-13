# Sudoku Studio

A small PHP 8.2+, vanilla JavaScript, and CSS web project. No framework, database, or package installation is required.

## Run locally

Open a terminal in this project folder and run:

```powershell
php -S 127.0.0.1:8080 -t public
```

Then open http://127.0.0.1:8080 in your browser. Stop the server with Ctrl+C. PHP's built-in server is for local development.

## Project map

- `public/index.php`: page structure and controls.
- `public/style.css`: responsive layout and board styling.
- `public/app.js`: browser state, automatic clickable candidates, keyboard input, undo, checking, and hints.
- `public/api.php`: JSON endpoint, e.g. `api.php?level=hard`.
- `src/Sudoku.php`: completed-grid generation, uniqueness checking, solver, and rating.
- `tests/sudoku_test.php`: generator and solver checks.

## How generation works

1. Randomized backtracking creates a complete valid grid.
2. Cells are removed in random order. Each removal is kept only if a minimum-remaining-values solver finds exactly one solution.
3. A deterministic solver applies naked singles, then hidden singles, then MRV branching. It records hidden singles, attempted branches (including unsuccessful ones), and maximum search depth.
4. Score = empty cells + 0.4 × hidden singles + 5 × attempted branches + 3 × maximum depth.
5. The five estimated score bands are Easy ≤40, Medium ≤49, Hard ≤59, Expert ≤74, and Master >74. Generation returns only a puzzle in the requested band, with a maximum clue count of 44/38/32/30/28 respectively. It retries up to 60 grids, then reports a recoverable error.

These are project-specific estimates, not a standardized human difficulty scale. This solver does not implement advanced human techniques such as pairs or X-Wings, so branching does not prove a human must guess. A future improvement is a strategy-based grader calibrated with human playtesting.

## Play

Matching-number highlights are always available: hover a candidate to highlight matches in its row, column, and box, or use the right-hand number dropdown to highlight across the board. Naked singles (one board-legal candidate in a cell) are bold. Manual cross-outs do not create new bold singles.

Under the board, **Cross out** switches clicks and number keys between placing numbers and marking candidates. Right-click always marks/restores a candidate. Undo includes marks; **Clear cross-outs**, below Pair and triple help, restores all marks. Changing a number clears marks because their premises may have changed.

**Pair and triple help** is always available directly below Restart puzzle. It outlines a useful naked pair/triple in blue and possible eliminations in orange, and explains the deduction without applying it. It ignores manual marks and asks you to fix incorrect entries first. Not every board has a useful naked pair/triple.

**Enlarge selected cell** remains optional on the right.

Each empty cell displays its current candidates in a small 3×3 arrangement. Click a candidate to fill that cell. Candidates exclude numbers already entered in the same row, column, or box; they are possibilities, not guaranteed solutions. They update automatically after every entry, erase, hint, undo, or restart. A × means earlier entries have left a cell with no candidates.

Select a filled cell and use Erase to change it. Keyboard entry with 1–9 still works; arrow keys move within the board and Delete/Backspace clears a cell. Hints reveal a correct cell; Check compares entered numbers with the solution. Undo also reverses hints and restarts.

Progress is kept in memory only; refreshing closes the current game. The browser asks before discarding edited, unfinished progress. The solution is sent to the browser for this local single-player app; this is not a competition or anti-cheat design. Google Fonts are optional; local fallback fonts work offline.

## Test

```powershell
php tests/sudoku_test.php
node --check public/app.js
```

The test checks multiple puzzles at every difficulty for valid solutions, matching givens, exactly one solution, and the requested rating. It also checks a known Sudoku fixture and a grid with multiple solutions.
