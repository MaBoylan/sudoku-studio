'use strict';

// Find a naked pair/triple with at least one useful elimination.
// The supplied candidates must come from the board, not guessed exclusions.
function findTuple(candidateMap) {
  const units = [];
  for (let i = 0; i < 9; i++) {
    units.push({ name: `row ${i + 1}`, cells: Array.from({ length: 9 }, (_, j) => i * 9 + j) });
    units.push({ name: `column ${i + 1}`, cells: Array.from({ length: 9 }, (_, j) => j * 9 + i) });
    units.push({ name: `box ${i + 1}`, cells: Array.from({ length: 9 }, (_, j) =>
      (Math.floor(i / 3) * 3 + Math.floor(j / 3)) * 9 + (i % 3) * 3 + j % 3) });
  }
  function combinations(items, size, start = 0, chosen = []) {
    if (chosen.length === size) return [chosen];
    const result = [];
    for (let i = start; i <= items.length - (size - chosen.length); i++) {
      result.push(...combinations(items, size, i + 1, [...chosen, items[i]]));
    }
    return result;
  }
  for (const size of [2, 3]) {
    for (const unit of units) {
      const eligible = unit.cells.filter(i => candidateMap[i].length >= 2 && candidateMap[i].length <= size);
      for (const cells of combinations(eligible, size)) {
        const digits = [...new Set(cells.flatMap(i => candidateMap[i]))].sort();
        if (digits.length !== size) continue;
        const removals = unit.cells.filter(i => !cells.includes(i)).flatMap(i =>
          candidateMap[i].filter(n => digits.includes(n)).map(n => ({ cell: i, digit: n })));
        if (removals.length) return { size, unit: unit.name, cells, digits, removals };
      }
    }
  }
  return null;
}
