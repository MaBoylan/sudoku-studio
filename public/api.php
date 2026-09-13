<?php
declare(strict_types=1);
require __DIR__ . '/../src/Sudoku.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Use GET.']);
    exit;
}
$level = $_GET['level'] ?? 'easy';
if (!is_string($level) || !in_array($level, Sudoku::LEVELS, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Choose easy, medium, hard, expert, or master.']);
    exit;
}
try {
    set_time_limit(60);
    echo json_encode(Sudoku::generate($level), JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['error' => 'Puzzle generation failed. Please try again.']);
}
