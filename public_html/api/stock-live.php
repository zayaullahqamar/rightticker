<?php
/**
 * RightTicker.com - Live Market Data Fetcher & Cacher
 * 
 * Fetches latest Price, Up/Down Change, Volume, 52-Week Range,
 * and 60-day closing prices from free market feeds.
 * Caches responses for 15 minutes to guarantee 0% chance of rate limiting.
 */
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// 1. Sanitize ticker
$rawTicker = $_GET['ticker'] ?? '';
$ticker = strtoupper(trim((string)$rawTicker));
$ticker = preg_replace('/^NSE:/', '', $ticker);
$ticker = preg_replace('/\.NS$/', '', $ticker);

if ($ticker === '' || !preg_match('/^[A-Z0-9\&\-\.]{1,30}$/', $ticker)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid ticker symbol.']);
    exit;
}

// 2. Cache management (15 minutes = 900 seconds)
$cacheDir = dirname(__DIR__) . '/data/cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}
$safeFileTicker = preg_replace('/[^A-Z0-9]/', '_', $ticker);
$cacheFile = $cacheDir . '/' . $safeFileTicker . '.json';
$cacheDuration = 900; // 15 minutes

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheDuration) {
    header('Cache-Control: public, max-age=' . ($cacheDuration - (time() - filemtime($cacheFile))));
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// 3. Fetch from market API
$symbol = urlencode($ticker) . '.NS';
$url = 'https://query1.finance.yahoo.com/v8/finance/chart/' . $symbol . '?range=3mo&interval=1d';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36\r\nAccept: application/json\r\n",
        'timeout' => 6,
        'ignore_errors' => true
    ]
]);

$response = @file_get_contents($url, false, $context);

if (!$response) {
    // If external call fails, serve stale cache if available
    if (file_exists($cacheFile)) {
        header('X-Cache: STALE');
        readfile($cacheFile);
        exit;
    }
    http_response_code(502);
    echo json_encode(['error' => 'Market feed temporarily unavailable.']);
    exit;
}

$data = json_decode($response, true);
$chart = $data['chart']['result'][0] ?? null;

if (!$chart || empty($chart['meta'])) {
    if (file_exists($cacheFile)) {
        header('X-Cache: STALE');
        readfile($cacheFile);
        exit;
    }
    http_response_code(404);
    echo json_encode(['error' => 'Stock market data not found for ticker: ' . $ticker]);
    exit;
}

$meta = $chart['meta'];
$price = isset($meta['regularMarketPrice']) ? (float)$meta['regularMarketPrice'] : null;

// Determine price change (Up / Down)
$change = isset($meta['fulldayChange']) ? (float)$meta['fulldayChange'] : null;
$changePercent = isset($meta['fulldayChangePercent']) ? (float)$meta['fulldayChangePercent'] : null;

if ($change === null && isset($meta['chartPreviousClose']) && $price !== null && $meta['chartPreviousClose'] > 0) {
    $change = round($price - (float)$meta['chartPreviousClose'], 2);
    $changePercent = round(($change / (float)$meta['chartPreviousClose']) * 100, 2);
}

// Volume & 52-week range
$volume = isset($meta['regularMarketVolume']) ? (int)$meta['regularMarketVolume'] : null;
$low52 = isset($meta['fiftyTwoWeekLow']) ? (float)$meta['fiftyTwoWeekLow'] : null;
$high52 = isset($meta['fiftyTwoWeekHigh']) ? (float)$meta['fiftyTwoWeekHigh'] : null;

// 60-day closing prices (newest first)
$rawQuotes = $chart['indicators']['quote'][0]['close'] ?? [];
$validCloses = [];
foreach ($rawQuotes as $val) {
    if (is_numeric($val) && $val > 0) {
        $validCloses[] = round((float)$val, 2);
    }
}

// Take up to 60 most recent closing prices, newest first
$recentCloses = array_slice($validCloses, -60);
$newestFirst = array_reverse($recentCloses);

$result = [
    'ticker' => $ticker,
    'price' => $price,
    'change' => $change !== null ? round($change, 2) : null,
    'changePercent' => $changePercent !== null ? round($changePercent, 2) : null,
    'volume' => $volume,
    'low52' => $low52,
    'high52' => $high52,
    'history' => $newestFirst,
    'updatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
    'cached' => false
];

$jsonPayload = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
file_put_contents($cacheFile, $jsonPayload, LOCK_EX);

header('Cache-Control: public, max-age=' . $cacheDuration);
header('X-Cache: MISS');
echo $jsonPayload;
exit;
