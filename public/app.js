'use strict';

const $ = (id) => document.getElementById(id);
const descriptions = {
  easy: 'A gentle start with plenty of clues.',
  medium: 'Fewer clues. A little more deduction.',
  hard: 'Look closely and connect the possibilities.',
  expert: 'A deeper challenge for patient solvers.',
  master: 'Our highest estimated difficulty. Bring your pencil.'
};
let game = null, values = [], selected = 0, busy = false;
let history = [], errors = new Set(), completed = false;
let excluded = Array.from({ length: 81 }, () => new Set());
let deduction = null, hoverNumber = 0, hoverCell = -1;
const cells = [];

for (let i = 0; i < 81; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.setAttribute('role', 'group');
  cell.addEventListener('click', () => {
    if (!game || busy) return;
    selected = i;
    highlightSelection();
    cell.focus({ preventScroll: true });
  });
  // Highlight without rebuilding buttons: pointer focus happens before click.
  cell.addEventListener('focusin', () => { selected = i; highlightSelection(); });
  $('board').append(cell);
  cells.push(cell);
}
function message(text) { $('status').textContent = text; }
function saveUndo() {
  history.push({ values: [...values], excluded: excluded.map(set => [...set]) });
  if (history.length > 300) history.shift();
}

// Candidates depend only on current row, column and box entries, not the solution.
function candidatesFor(index) {
  const row = Math.floor(index / 9), col = index % 9;
  const used = new Set();
  for (let i = 0; i < 9; i++) {
    used.add(values[row * 9 + i]);
    used.add(values[i * 9 + col]);
    used.add(values[(Math.floor(row / 3) * 3 + Math.floor(i / 3)) * 9
      + Math.floor(col / 3) * 3 + i % 3]);
  }
  return Array.from({ length: 9 }, (_, i) => i + 1).filter(n => !used.has(n));
}

function highlightSelection() {
  const row = Math.floor(selected / 9), col = selected % 9;
  cells.forEach((cell, i) => {
    const r = Math.floor(i / 9), c = i % 9, value = values[i] || 0;
    cell.classList.toggle('peer', r === row || c === col || (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3)));
    cell.classList.toggle('same', Boolean(value && value === values[selected]));
    cell.classList.toggle('selected', i === selected);
    cell.classList.toggle('enlarged', i === selected && !value && $('large-mode').checked);
    cell.style.transformOrigin = `${c === 0 ? 'left' : c === 8 ? 'right' : 'center'} ${r === 0 ? 'top' : r === 8 ? 'bottom' : 'center'}`;
    cell.tabIndex = game && !busy && i === selected ? 0 : -1;
  });
}

function render() {
  hoverNumber = 0;
  hoverCell = -1;
  const hadBoardFocus = $('board').contains(document.activeElement);
  cells.forEach((cell, i) => {
    const r = Math.floor(i / 9), c = i % 9, value = values[i] || 0;
    cell.className = 'cell';
    cell.classList.toggle('given', Boolean(game?.puzzle[i]));
    cell.classList.toggle('error', errors.has(i));
    cell.classList.toggle('tuple-source', Boolean(deduction?.cells.includes(i)));
    cell.setAttribute('aria-disabled', String(busy || !game));
    cell.replaceChildren();
    const candidates = game && !value ? candidatesFor(i) : [];
    if (value) cell.textContent = value;
    else if (game) {
      const mini = document.createElement('div');
      mini.className = 'mini';
      for (let n = 1; n <= 9; n++) {
        const available = candidates.includes(n);
        const digit = document.createElement(available ? 'button' : 'span');
        if (available) {
          digit.type = 'button';
          digit.className = 'candidate';
          digit.classList.toggle('naked-single', candidates.length === 1);
          if (candidates.length === 1) digit.title = 'Naked single: only one candidate fits this cell.';
          digit.dataset.number = n;
          digit.dataset.cell = i;
          digit.classList.toggle('excluded', excluded[i].has(n));
          digit.classList.toggle('tuple-remove', Boolean(deduction?.removals.some(item => item.cell === i && item.digit === n)));
          digit.textContent = n;
          digit.tabIndex = -1;
          digit.disabled = busy;
          const action = $('eliminate-mode').checked ? (excluded[i].has(n) ? 'Restore' : 'Cross out') : 'Place';
          digit.setAttribute('aria-label', `${action} ${n} in row ${r + 1}, column ${c + 1}${excluded[i].has(n) ? ', crossed out' : ''}`);
          digit.addEventListener('click', event => {
            event.stopPropagation();
            selected = i;
            if ($('eliminate-mode').checked) toggleCandidate(n);
            else if (excluded[i].has(n)) message('Enable Cross out candidates to restore this candidate, or type its number to place it.');
            else enter(n);
          });
          digit.addEventListener('contextmenu', event => {
            event.preventDefault();
            selected = i;
            toggleCandidate(n);
          });
          digit.addEventListener('mouseenter', () => { hoverNumber = n; hoverCell = i; paintMatches(); });
          digit.addEventListener('mouseleave', () => { hoverNumber = 0; hoverCell = -1; paintMatches(); });
        } else digit.setAttribute('aria-hidden', 'true');
        mini.append(digit);
      }
      cell.append(mini);
      if (!candidates.length) {
        const warning = document.createElement('span');
        warning.className = 'no-candidates';
        warning.textContent = '×';
        warning.title = 'No candidates remain. Check or erase an earlier entry.';
        cell.append(warning);
      }
    }
    const candidateText = game && !value ? `, ${candidates.length ? `candidates ${candidates.join(', ')}` : 'no candidates; check earlier entries'}` : '';
    cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${value || 'empty'}${game?.puzzle[i] ? ', given' : ''}${candidateText}`);
  });
  highlightSelection();
  paintMatches();
  $('board').classList.toggle('large-candidates', $('large-mode').checked);
  $('board').classList.toggle('eliminating', $('eliminate-mode').checked);
  $('show-deduction').disabled = busy || !game;
  $('eliminate-mode').disabled = busy || !game;
  $('clear-crossouts').disabled = busy || !game || !excluded.some(set => set.size);
  if (hadBoardFocus && !busy && game) cells[selected].focus({ preventScroll: true });
  $('progress').textContent = `${values.filter(Boolean).length} / 81 filled`;
  document.querySelectorAll('.actions button, #check, #hint, #reset').forEach(b => { b.disabled = busy || !game; });
  $('undo').disabled = busy || !game || history.length === 0;
  $('new-game').disabled = busy;
  $('difficulty').disabled = busy;
  if (game && values.every((v, i) => v === game.solution[i])) {
    if (!completed) message('Beautifully done — puzzle complete!');
    completed = true;
  } else completed = false;
}
function enter(n) {
  if (!game || busy || game.puzzle[selected] || values[selected] === n) return;
  saveUndo();
  errors.clear();
  values[selected] = n;
  // An entry changes the premises of manual deductions; discard stale exclusions.
  excluded = Array.from({ length: 81 }, () => new Set());
  clearDeduction();
  message(n ? `Placed ${n}. Candidates updated.` : 'Cell cleared. Candidates restored.');
  render();
}
function unfinished() { return game && !completed && history.length > 0; }
async function generate() {
  if (busy) return;
  if (unfinished() && !window.confirm('Replace this puzzle and discard your progress?')) return;
  busy = true;
  message('Building a puzzle and checking its unique solution…');
  render();
  try {
    const response = await fetch(`api.php?level=${encodeURIComponent($('difficulty').value)}`, { signal: AbortSignal.timeout(65000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to generate puzzle.');
    game = data;
    values = [...game.puzzle];
    history = [];
    excluded = Array.from({ length: 81 }, () => new Set());
    clearDeduction();
    errors.clear();
    selected = Math.max(0, values.indexOf(0));
    completed = false;
    const level = game.rating.level;
    $('puzzle-label').textContent = `${level[0].toUpperCase() + level.slice(1)} · ${game.rating.clues} clues`;
    message('Click a small candidate inside a cell to place that number.');
  } catch (error) {
    message(error.name === 'TimeoutError' ? 'Generation took too long. Please try again.' : `Could not load a puzzle. ${error.message}`);
  } finally { busy = false; render(); }
}
$('new-game').addEventListener('click', generate);
$('difficulty').addEventListener('change', () => { $('level-description').textContent = descriptions[$('difficulty').value]; });
$('erase').addEventListener('click', () => enter(0));
$('undo').addEventListener('click', () => {
  if (!history.length || busy) return;
  const previous = history.pop();
  values = previous.values;
  excluded = previous.excluded.map(items => new Set(items));
  clearDeduction();
  errors.clear(); message('Last change undone.'); render();
});
$('check').addEventListener('click', () => {
  if (!game || busy) return;
  errors = new Set(values.flatMap((v, i) => v && v !== game.solution[i] ? [i] : []));
  message(errors.size ? `${errors.size} incorrect ${errors.size === 1 ? 'cell is' : 'cells are'} highlighted.` : completed ? 'Puzzle complete — every answer is correct!' : 'All entered numbers are correct so far.');
  render();
});
$('hint').addEventListener('click', () => {
  if (!game || busy) return;
  let i = selected;
  if (game.puzzle[i] || values[i] === game.solution[i]) i = values.findIndex((v, j) => v !== game.solution[j]);
  if (i < 0) { message('You have already solved it!'); return; }
  saveUndo(); selected = i; values[i] = game.solution[i]; errors.clear();
  excluded = Array.from({ length: 81 }, () => new Set());
  clearDeduction();
  message(`Revealed row ${Math.floor(i / 9) + 1}, column ${i % 9 + 1}.`); render();
});
$('reset').addEventListener('click', () => {
  if (!game || busy || !window.confirm('Clear your entries for this puzzle?')) return;
  saveUndo(); values = [...game.puzzle];
  excluded = Array.from({ length: 81 }, () => new Set());
  clearDeduction();
  errors.clear(); message('Fresh start. Same puzzle.'); render();
});
$('board').addEventListener('keydown', (event) => {
  if (!game || busy || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key;
  if (/^[1-9]$/.test(key)) {
    event.preventDefault();
    if ($('eliminate-mode').checked) toggleCandidate(Number(key)); else enter(Number(key));
  }
  else if (['Backspace', 'Delete', '0'].includes(key)) { event.preventDefault(); enter(0); }
  else if (key.startsWith('Arrow')) {
    event.preventDefault();
    const row = Math.floor(selected / 9), col = selected % 9;
    if (key === 'ArrowLeft') selected = row * 9 + Math.max(0, col - 1);
    if (key === 'ArrowRight') selected = row * 9 + Math.min(8, col + 1);
    if (key === 'ArrowUp') selected = Math.max(0, row - 1) * 9 + col;
    if (key === 'ArrowDown') selected = Math.min(8, row + 1) * 9 + col;
    render(); cells[selected].focus();
  }
});
window.addEventListener('beforeunload', (event) => { if (unfinished()) { event.preventDefault(); event.returnValue = ''; } });

function toggleCandidate(n) {
  if (!game || busy || values[selected] || !candidatesFor(selected).includes(n)) return;
  saveUndo();
  if (excluded[selected].has(n)) excluded[selected].delete(n); else excluded[selected].add(n);
  message('Candidate mark updated. Undo can restore it.');
  render();
}

function paintMatches() {
  const number = hoverNumber || Number($('highlight-number').value);
  document.querySelectorAll('.candidate').forEach(button => {
    const i = Number(button.dataset.cell);
    const sameUnit = hoverCell < 0 || Math.floor(i / 9) === Math.floor(hoverCell / 9)
      || i % 9 === hoverCell % 9 || (Math.floor(i / 27) === Math.floor(hoverCell / 27)
      && Math.floor((i % 9) / 3) === Math.floor((hoverCell % 9) / 3));
    button.classList.toggle('matching', number > 0 && Number(button.dataset.number) === number && sameUnit && !excluded[i].has(number));
  });
}

function clearDeduction() {
  deduction = null;
  $('deduction-text').textContent = 'Choose Pair and triple help to look for a useful pair or triple.';
}

for (const id of ['eliminate-mode', 'large-mode']) {
  $(id).addEventListener('change', () => {
    render();
  });
}
$('highlight-number').addEventListener('change', paintMatches);
$('clear-crossouts').addEventListener('click', () => {
  if (!game || busy || !excluded.some(set => set.size)) return;
  saveUndo(); excluded = Array.from({ length: 81 }, () => new Set());
  message('All crossed-out candidates restored.'); render();
});
$('show-deduction').addEventListener('click', () => {
  if (!game || busy) return;
  // Do not present deductions based on incorrect entries or unverified pencil marks.
  if (values.some((v, i) => v && v !== game.solution[i])) {
    clearDeduction();
    $('deduction-text').textContent = 'An entry is incorrect. Use Check answers and correct it before requesting a deduction.';
    render(); return;
  }
  deduction = findTuple(values.map((v, i) => v ? [] : candidatesFor(i)));
  if (deduction) {
    const name = deduction.size === 2 ? 'pair' : 'triple';
    const positions = deduction.cells.map(i => `R${Math.floor(i / 9) + 1}C${i % 9 + 1}`).join(', ');
    $('deduction-text').textContent = `Naked ${name} in ${deduction.unit}: ${positions} contain only ${deduction.digits.join(', ')}. These numbers must occupy those ${deduction.size} cells (outlined in blue). Cross out the orange candidates elsewhere in that ${deduction.unit}. No numbers or marks have been changed.`;
  } else $('deduction-text').textContent = 'No useful naked pair or triple found on this board. This helper does not cover every Sudoku technique.';
  render();
});
render();
generate();
