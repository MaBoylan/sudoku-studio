<?php
declare(strict_types=1);
require __DIR__ . '/../src/Sudoku.php';
function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function validSolution(array $grid): bool {
    for ($i = 0; $i < 9; $i++) {
        $row = $col = $box = [];
        for ($j = 0; $j < 9; $j++) {
            $row[] = $grid[$i * 9 + $j];
            $col[] = $grid[$j * 9 + $i];
            $box[] = $grid[(intdiv($i, 3) * 3 + intdiv($j, 3)) * 9 + ($i % 3) * 3 + $j % 3];
        }
        foreach ([$row, $col, $box] as $unit) {
            sort($unit);
            if ($unit !== range(1, 9)) return false;
        }
    }
    return true;
}
$fixture = array_map('intval', str_split('530070000600195000098000060800060003400803001700020006060000280000419005000080079'));
check(Sudoku::countSolutions($fixture) === 1, 'Known puzzle must be unique');
check(Sudoku::countSolutions(array_fill(0, 81, 0)) === 2, 'Empty grid has multiple solutions');
try { Sudoku::generate('invalid'); throw new RuntimeException('Invalid level accepted'); }
catch (InvalidArgumentException $expected) {}
foreach (Sudoku::LEVELS as $level) {
    $start = microtime(true);
    for ($test = 0; $test < 5; $test++) {
        $game = Sudoku::generate($level);
        check(count($game['puzzle']) === 81, 'Grid size');
        check(validSolution($game['solution']), 'Invalid solution');
        foreach ($game['puzzle'] as $i => $value) {
            check($value === 0 || $value === $game['solution'][$i], 'Given differs from solution');
        }
        check(Sudoku::countSolutions($game['puzzle']) === 1, 'Puzzle is not unique');
        check($game['rating']['level'] === $level, 'Requested difficulty mismatch');
        check(Sudoku::rate($game['puzzle']) === $game['rating'], 'Rating must be deterministic');
    }
    printf("PASS %s: 5 unique puzzles (%.2fs)\n", $level, microtime(true) - $start);
}
echo "All tests passed.\n";
