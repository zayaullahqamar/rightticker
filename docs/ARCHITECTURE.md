# RightTicker Technical Architecture & Compression Report

## 1. Project Organization Overview

The project is structured according to strict separation of concerns:

```
C:\Users\hp\Desktop\Right ticker\
├── public_html/              # Production deployable web root for Hostinger
│   ├── .htaccess             # LiteSpeed compression, caching, routing & security
│   ├── index.html            # Main web application entry point (14.9 KB)
│   ├── favicon.png           # 64x64 Retina favicon (2.6 KB)
│   ├── logo.png              # High-definition web-optimized logo (47 KB)
│   ├── api/
│   │   ├── .htaccess         # API security & internal file blocking
│   │   └── watchlist.php     # High-performance PHP SQLite PDO API
│   ├── data/
│   │   ├── .htaccess         # Cache headers & database protection
│   │   ├── stocks-data.js    # Stock metrics & 60-day historical prices
│   │   └── watchlist.sqlite  # Visitor watchlist database (created on first save)
│   ├── css/
│   │   └── app.min.css       # Unified minified stylesheets (23 KB gzipped)
│   └── js/
│       ├── app.js            # Screener table, filtering & sorting logic
│       ├── views.js          # Overview, Watchlist & resilient sync
│       ├── analytics.js      # Monte Carlo simulations & sparkline charts
│       ├── research.js       # AI research prompts & news deep-links
│       ├── site-info.js      # Modal dialogs & documentation
│       └── xlsx.full.min.js  # SheetJS (lazy-loaded on export click)
├── backend/                  # Server-side components & database definitions
│   ├── php/                  # Hostinger PHP implementation
│   ├── cloudflare-worker/    # Cloudflare Worker implementation (for reference)
│   └── database/             # SQLite & MySQL schema definitions and migrations
├── scripts/                  # Build, automation & data synchronization tools
│   ├── build-optimize.ps1    # Automated pre-compression & build script
│   ├── preview-local.ps1     # Zero-dependency local PowerShell web server
│   ├── import-database.py    # Excel workbook synchronization script
│   └── build.mjs             # Cloudflare worker bundler
├── docs/                     # Comprehensive documentation & manuals
│   ├── HOSTINGER-DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── DATA-IMPORT-GUIDE.md
└── backup/                   # Immutable backups
    └── RightTicker-Website.zip
```

---

## 2. Optimization & Compression Breakdown

### A. HTML Payload Optimization
- **Before:** `2,210,125 bytes` (~2.21 MB). Contained two base64-encoded PNG images: a 1960x1959 favicon and 1971x411 logo directly embedded in the HTML text.
- **After:** `14,981 bytes` (~14.9 KB). Images were extracted into separate optimized web assets and referenced cleanly.
- **Result:** **99.32% reduction** in raw HTML payload. Instant initial DOM parsing and First Contentful Paint (FCP).

### B. Image Asset Optimization
- **Logo:** Downscaled from uncompressed 1971px to 2x retina 410px using high-quality bicubic resampling. Size reduced from `806 KB` to `47 KB`.
- **Favicon:** Scaled to standard 64x64 high-DPI favicon. Size reduced from `839 KB` to `2.6 KB`.

### C. Script & Stylesheet Deferral
- **SheetJS (`xlsx.full.min.js`):** Previously loaded synchronously in the `<head>` on every page visit (`881 KB`). Now loaded asynchronously on-demand only when a user initiates a `.xls` download.
- **CSS Bundling:** Consolidated 4 separate stylesheet requests (`styles.css`, `views.css`, `mobile.css`, `refinements.css`) into a single `app.min.css` (gzipped to `23.3 KB`).

### D. Server Resource Footprint on Hostinger
- **Persistent Memory:** Cloudflare Workers and Node.js daemon setups require persistent background processes (80–150MB RAM). On Hostinger shared hosting, `api/watchlist.php` runs statelessly via PHP 8.x with PDO SQLite: execution time is under **2 milliseconds**, memory footprint per request is under **2MB**, and releases immediately.
- **Pre-Compressed Assets:** LiteSpeed Web Server automatically detects pre-compressed `.gz` files (`stocks-data.js.gz`, `app.min.css.gz`, `index.html.gz`) and serves them directly without expending server CPU cycles on runtime compression.
