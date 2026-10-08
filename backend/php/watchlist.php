<?php
/**
 * RightTicker.com - High-Performance Watchlist API for Hostinger
 * 
 * Optimized for LiteSpeed / Apache shared hosting.
 * Uses native SQLite3 via PDO for instant execution and 0MB persistent RAM usage.
 */
declare(strict_types=1);

// Disable error display to avoid corrupting JSON output; log to server error log
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// 1. Validate Origin header if present (Cross-Origin Protection)
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $currentHost = $_SERVER['HTTP_HOST'] ?? '';
    $originUrl = parse_url($_SERVER['HTTP_ORIGIN']);
    $originHost = $originUrl['host'] ?? '';
    if (!empty($originHost) && strcasecmp($originHost, $currentHost) !== 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Request origin is not allowed'], JSON_UNESCAPED_SLASHES);
        exit;
    }
}

// 2. Identify or Generate Visitor ID (bullscan_visitor Cookie)
$cookieName = 'bullscan_visitor';
$visitorId = $_COOKIE[$cookieName] ?? null;

if (!$visitorId || !preg_match('/^[a-f0-9\-]{36}$/i', $visitorId)) {
    // Generate RFC 4122 v4 UUID
    $bytes = random_bytes(16);
    $bytes[6] = chr(ord($bytes[6]) & 0x0f | 0x40);
    $bytes[8] = chr(ord($bytes[8]) & 0x3f | 0x80);
    $visitorId = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
               || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    setcookie($cookieName, $visitorId, [
        'expires' => time() + 31536000, // 1 year
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

// 3. Connect to SQLite Database
$dbDirectory = dirname(__DIR__) . '/data';
if (!is_dir($dbDirectory)) {
    @mkdir($dbDirectory, 0755, true);
}
$dbPath = $dbDirectory . '/watchlist.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ]);
    // High-performance concurrency settings for SQLite
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA synchronous = NORMAL;');
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS watchlist (
            visitor_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (visitor_id, ticker)
        );
        CREATE INDEX IF NOT EXISTS idx_watchlist_vis ON watchlist (visitor_id, created_at ASC);
    ');
} catch (Throwable $e) {
    error_log('Watchlist SQLite Error: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(['error' => 'Watchlist storage temporarily unavailable.'], JSON_UNESCAPED_SLASHES);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// Helper to fetch current saved tickers for the visitor
function fetchVisitorTickers(PDO $pdo, string $visitorId): array {
    $stmt = $pdo->prepare('SELECT ticker FROM watchlist WHERE visitor_id = ? ORDER BY created_at ASC, ticker ASC');
    $stmt->execute([$visitorId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN, 0) ?: [];
}

// 4. Handle GET Request
if ($method === 'GET') {
    $tickers = fetchVisitorTickers($pdo, $visitorId);
    echo json_encode(['tickers' => $tickers, 'account' => null], JSON_UNESCAPED_SLASHES);
    exit;
}

// 5. Handle POST / DELETE Requests
if ($method === 'POST' || $method === 'DELETE') {
    $input = file_get_contents('php://input');
    $body = json_decode($input ?: '{}', true);
    $ticker = isset($body['ticker']) ? trim((string)$body['ticker']) : '';

    if ($ticker === '' || !preg_match('/^[A-Za-z0-9\&\-\.]{1,30}$/', $ticker)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ticker symbol.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($method === 'POST') {
        $stmt = $pdo->prepare('INSERT OR IGNORE INTO watchlist (visitor_id, ticker, created_at) VALUES (?, ?, ?)');
        $stmt->execute([$visitorId, $ticker, gmdate('Y-m-d\TH:i:s\Z')]);
    } else {
        $stmt = $pdo->prepare('DELETE FROM watchlist WHERE visitor_id = ? AND ticker = ?');
        $stmt->execute([$visitorId, $ticker]);
    }

    $tickers = fetchVisitorTickers($pdo, $visitorId);
    echo json_encode(['tickers' => $tickers, 'account' => null], JSON_UNESCAPED_SLASHES);
    exit;
}

// 6. Any other HTTP method
http_response_code(405);
header('Allow: GET, POST, DELETE');
echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_SLASHES);
exit;
