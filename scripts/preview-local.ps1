# RightTicker - Zero-Dependency Local Web Server
# Run in PowerShell: .\scripts\preview-local.ps1
param(
    [int]$Port = 8080
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..\public_html")
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " RightTicker Local Preview Server Running" -ForegroundColor Cyan
    Write-Host " Address: http://localhost:$Port/" -ForegroundColor Yellow
    Write-Host " Serving: $root" -ForegroundColor Gray
    Write-Host " Press Ctrl+C in this console to stop the server." -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Green
    
    Start-Process "http://localhost:$Port/"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $path = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") { $path = "index.html" }

        $localFile = Join-Path $root $path
        if (Test-Path $localFile -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localFile)
            $ext = [System.IO.Path]::GetExtension($localFile).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "text/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".ico"  { "image/x-icon" }
                ".svg"  { "image/svg+xml" }
                ".txt"  { "text/plain; charset=utf-8" }
                Default { "application/octet-stream" }
            }
            $res.ContentType = $mime
            $res.ContentLength64 = $bytes.Length
            $res.StatusCode = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
        $res.Close()
    }
} finally {
    $listener.Stop()
}
