<?php
declare(strict_types=1);

/** Standard 9x9 Sudoku: MRV search, uniqueness checks, and estimated ratings. */
final class Sudoku
{
    public const LEVELS = ['easy', 'medium', 'hard', 'expert', 'master'];

    public static function candidates(array $grid, int $cell): array
    {
        $row = intdiv($cell, 9);
        $col = $cell % 9;
        $used = [];
        for ($i = 0; $i < 9; $i++) {
            $used[$grid[$row * 9 + $i]] = true;
            $used[$grid[$i * 9 + $col]] = true;
            $box = (intdiv($row, 3) * 3 + intdiv($i, 3)) * 9
                + intdiv($col, 3) * 3 + $i % 3;
            $used[$grid[$box]] = true;
        }
        return array_values(array_filter(range(1, 9), fn($n) => !isset($used[$n])));
    }

    /** Stops at $limit: we only need to distinguish zero, one, and multiple solutions. */
    public static function countSolutions(array $grid, int $limit = 2): int
    {
        $cell = -1;
        $options = [];
        foreach ($grid as $i => $value) {
            if ($value !== 0) continue;
            $next = self::candidates($grid, $i);
            if (!$next) return 0;
            if ($cell === -1 || count($next) < count($options)) {
                $cell = $i;
                $options = $next;
                if (count($next) === 1) break;
            }
        }
        if ($cell === -1) return 1;
        $count = 0;
        foreach ($options as $value) {
            $grid[$cell] = $value;
            $count += self::countSolutions($grid, $limit - $count);
            if ($count >= $limit) return $count;
        }
        return $count;
    }

    private static function fill(array &$grid): bool
    {
        $cell = array_search(0, $grid, true);
        if ($cell === false) return true;
        $options = self::candidates($grid, $cell);
        shuffle($options);
        foreach ($options as $value) {
            $grid[$cell] = $value;
            if (self::fill($grid)) return true;
        }
        $grid[$cell] = 0;
        return false;
    }

    private static function units(): array
    {
        $units = [];
        for ($i = 0; $i < 9; $i++) {
            $row = $col = $box = [];
            for ($j = 0; $j < 9; $j++) {
                $row[] = $i * 9 + $j;
                $col[] = $j * 9 + $i;
                $box[] = (intdiv($i, 3) * 3 + intdiv($j, 3)) * 9 + ($i % 3) * 3 + $j % 3;
            }
            array_push($units, $row, $col, $box);
        }
        return $units;
    }

    /** A deterministic solver measures singles and search effort, including failed branches. */
    private static function solveRated(array $grid, array &$stats, int $depth = 0): bool
    {
        $stats['depth'] = max($stats['depth'], $depth);
        while (true) {
            $map = [];
            foreach ($grid as $i => $value) {
                if ($value !== 0) continue;
                $map[$i] = self::candidates($grid, $i);
                if (!$map[$i]) return false;
            }
            if (!$map) return true;
            foreach ($map as $i => $options) {
                if (count($options) === 1) {
                    $grid[$i] = $options[0];
                    $stats['singles']++;
                    continue 2;
                }
            }
            foreach (self::units() as $unit) {
                for ($n = 1; $n <= 9; $n++) {
                    $places = [];
                    foreach ($unit as $i) {
                        if (isset($map[$i]) && in_array($n, $map[$i], true)) $places[] = $i;
                    }
                    if (count($places) === 1) {
                        $grid[$places[0]] = $n;
                        $stats['hiddenSingles']++;
                        continue 3;
                    }
                }
            }
            uasort($map, fn($a, $b) => count($a) <=> count($b));
            $cell = array_key_first($map);
            foreach ($map[$cell] as $value) {
                $stats['branches']++;
                $trial = $grid;
                $trial[$cell] = $value;
                if (self::solveRated($trial, $stats, $depth + 1)) return true;
            }
            return false;
        }
    }

    public static function rate(array $grid): array
    {
        $stats = ['singles' => 0, 'hiddenSingles' => 0, 'branches' => 0, 'depth' => 0];
        self::solveRated($grid, $stats);
        $clues = count(array_filter($grid));
        $score = round(81 - $clues + $stats['hiddenSingles'] * 0.4
            + $stats['branches'] * 5 + $stats['depth'] * 3, 1);
        $index = $score <= 40 ? 0 : ($score <= 49 ? 1 : ($score <= 59 ? 2 : ($score <= 74 ? 3 : 4)));
        return ['level' => self::LEVELS[$index], 'score' => $score, 'clues' => $clues, 'techniques' => $stats];
    }

    public static function generate(string $level): array
    {
        if (!in_array($level, self::LEVELS, true)) throw new InvalidArgumentException('Unknown difficulty.');
        $target = array_search($level, self::LEVELS, true);
        // Rebuild if a removal jumps past the desired rating interval.
        for ($attempt = 0; $attempt < 60; $attempt++) {
            $solution = array_fill(0, 81, 0);
            self::fill($solution);
            $grid = $solution;
            $cells = range(0, 80);
            shuffle($cells);
            foreach ($cells as $cell) {
                $saved = $grid[$cell];
                $grid[$cell] = 0;
                if (self::countSolutions($grid) !== 1) {
                    $grid[$cell] = $saved;
                    continue;
                }
                $rating = self::rate($grid);
                $index = array_search($rating['level'], self::LEVELS, true);
                if ($index === $target && $rating['clues'] <= [44, 38, 32, 30, 28][$target]) {
                    return ['puzzle' => $grid, 'solution' => $solution, 'rating' => $rating];
                }
                if ($index > $target) break;
            }
        }
        throw new RuntimeException('Could not find this rating. Please try again.');
    }
}
