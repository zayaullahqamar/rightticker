# RightTicker.com

A professional, high-performance web platform for equity screener research, valuation estimates, and watchlist tracking for 2,559 NSE tickers.

Optimized specifically for **Hostinger Unlimited Web Hosting** (`rightticker.com`, Frankfurt, Germany) with minimal resource consumption, aggressive asset compression, and native PHP/SQLite backend integration.

---

## 📁 Directory Structure

```
C:\Users\hp\Desktop\Right ticker\
├── public_html/              <- [HOSTINGER DEPLOYMENT ROOT] Upload contents directly to Hostinger
│   ├── .htaccess             <- LiteSpeed cache, compression, security & routing
│   ├── index.html            <- Compressed homepage (14.9 KB vs original 2.21 MB)
│   ├── favicon.png           <- Optimized 64x64 Retina favicon (2.6 KB)
│   ├── logo.png              <- Optimized header logo (47 KB)
│   ├── api/
│   │   ├── .htaccess         <- API security & access control
│   │   └── watchlist.php     <- Zero-RAM PHP SQLite PDO Watchlist API
│   ├── data/
│   │   ├── .htaccess         <- Cache headers & database protection
│   │   ├── stocks-data.js    <- Full stock database (2,559 tickers, metrics & history)
│   │   └── stocks-data.js.gz <- Pre-compressed copy for LiteSpeed direct serving
│   ├── css/
│   │   ├── app.min.css       <- Merged production stylesheet (23 KB gzipped)
│   │   └── app.min.css.gz    <- Pre-compressed stylesheet
│   └── js/
│       ├── app.js            <- Screener, sorting, filtering & table logic
│       ├── views.js          <- Overview, Watchlist & resilient localStorage sync
│       ├── analytics.js      <- Monte Carlo simulations & price sparklines
│       ├── research.js       <- AI prompt generator & news scanner
│       ├── site-info.js      <- About, Contact, Privacy, Disclaimer modal dialogs
│       └── xlsx.full.min.js  <- Lazy-loaded on export click (0 KB on initial load)
├── backend/                  <- Source backend code, schemas & migrations
│   ├── php/                  <- Hostinger PHP Watchlist API
│   ├── cloudflare-worker/    <- Original Cloudflare worker implementation
│   └── database/             <- SQLite & MySQL database schemas
├── scripts/                  <- Automation & build scripts
│   ├── build-optimize.ps1    <- Production build & gzip compression script
│   ├── preview-local.ps1     <- Zero-dependency local web server (PowerShell)
│   ├── import-database.py    <- Python Excel workbook synchronization tool
│   └── build.mjs             <- Original bundler script
├── docs/                     <- Project documentation & manuals
│   ├── HOSTINGER-DEPLOYMENT.md  <- Complete step-by-step Hostinger deployment guide
│   ├── ARCHITECTURE.md          <- System architecture & compression benchmarks
│   └── DATA-IMPORT-GUIDE.md     <- Excel workbook import manual
└── backup/                   <- Untouched archive copies
    └── RightTicker-Website.zip
```

---

## 🚀 Quick Start: Local Preview

To preview the website locally on your computer with zero dependencies:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/preview-local.ps1"
```

This opens `http://localhost:8080/` in your browser.

---

## 🌐 Deploy to Hostinger

Follow the step-by-step instructions in [HOSTINGER-DEPLOYMENT.md](docs/HOSTINGER-DEPLOYMENT.md):
1. Open Hostinger hPanel File Manager for `rightticker.com`.
2. Upload the contents of `public_html/` into your Hostinger `public_html/` folder.
3. Done! The website is live, fully compressed, and persistent watchlists work out of the box.

---

## ⚡ Key Optimizations Implemented

- **Initial HTML Transfer:** Reduced by **99.32%** (from 2,210 KB to 14.9 KB) by extracting giant inline base64 images into separate optimized assets.
- **Lazy Loaded Libraries:** SheetJS (`881 KB`) was removed from the initial page payload and is loaded on-demand only when a user clicks `.xls` download.
- **Zero-RAM Backend:** Replaced heavy Node.js background worker with an ultra-fast, stateless PHP SQLite PDO endpoint running in under 2ms with 0MB persistent RAM usage.
- **Offline / Local Fallback:** Watchlist seamlessly falls back to browser `localStorage` if network connectivity is interrupted.
- **Pre-Compressed Assets:** LiteSpeed pre-gzipped `.gz` files reduce bandwidth consumption by over 74%.
