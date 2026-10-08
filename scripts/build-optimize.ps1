# RightTicker - Production Build & Asset Pre-Compression Script
# Generates pre-gzipped assets for Hostinger LiteSpeed Web Server

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\public_html")

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Building & Pre-Compressing RightTicker for Hostinger" -ForegroundColor Cyan
Write-Host " Web Root: $root" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

function Compress-FileGzip($filePath) {
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $gzPath = $filePath + ".gz"
    $ms = New-Object System.IO.MemoryStream
    $gz = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionLevel]::Optimal)
    $gz.Write($bytes, 0, $bytes.Length)
    $gz.Close()
    [System.IO.File]::WriteAllBytes($gzPath, $ms.ToArray())
    
    $orig = (Get-Item $filePath).Length
    $comp = (Get-Item $gzPath).Length
    $savings = [Math]::Round((1 - $comp/$orig) * 100, 1)
    Write-Host "Compressed $(Split-Path $filePath -Leaf): $([Math]::Round($orig/1KB, 1)) KB -> $([Math]::Round($comp/1KB, 1)) KB ($savings% savings)" -ForegroundColor Green
}

# Pre-compress large static assets
$targets = @(
    (Join-Path $root "data\stocks-data.js"),
    (Join-Path $root "index.html"),
    (Join-Path $root "css\app.min.css"),
    (Join-Path $root "js\app.js"),
    (Join-Path $root "js\views.js"),
    (Join-Path $root "js\analytics.js"),
    (Join-Path $root "js\research.js"),
    (Join-Path $root "js\site-info.js")
)

foreach ($t in $targets) {
    if (Test-Path $t) {
        Compress-FileGzip $t
    }
}

Write-Host "`nAll production assets built and pre-compressed successfully!" -ForegroundColor Cyan
