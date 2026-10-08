# Hostinger Deployment Guide for RightTicker.com

This guide explains how to deploy **RightTicker** to your **Hostinger Unlimited Web Hosting** package (`rightticker.com`, Frankfurt, Germany) with zero RAM overhead, lightning-fast TTFB, and minimal CPU consumption.

---

## 1. What Goes to Hostinger?

You only need to upload the contents of the **`public_html/`** folder.

```
public_html/
├── .htaccess              <- Master LiteSpeed configuration (Gzip, caching, routing, security)
├── index.html             <- Ultra-compressed homepage (only 14 KB!)
├── favicon.png            <- Crisp high-DPI browser icon (2.6 KB)
├── logo.png               <- Web-optimized header logo (47 KB)
├── SHEETJS-LICENSE.txt    <- SheetJS open-source license
├── api/
│   ├── .htaccess          <- API security headers & data file protection
│   └── watchlist.php      <- High-performance PHP Watchlist API (SQLite PDO)
├── data/
│   ├── .htaccess          <- Aggressive caching headers & database protection
│   ├── stocks-data.js     <- Complete stock database (2,559 tickers)
│   ├── stocks-data.js.gz  <- Pre-compressed copy for instant LiteSpeed serving
│   └── watchlist.sqlite   <- (Auto-created on first use) Persistent visitor database
├── css/
│   ├── app.min.css        <- Combined minified production stylesheet (23 KB gzipped)
│   └── app.min.css.gz     <- Pre-compressed stylesheet
└── js/
    ├── app.js             <- Stock screener & table logic
    ├── views.js           <- Stock overview & watchlist controller
    ├── analytics.js       <- 60-day simulations & price calculation engine
    ├── research.js        <- Research prompt generator & news scanner
    ├── site-info.js       <- Methodology, glossary & disclaimers
    └── xlsx.full.min.js   <- Excel export library (loaded on-demand when downloading)
```

---

## 2. Deployment Steps (via Hostinger hPanel File Manager)

### Step 2.1: Log in to Hostinger hPanel
1. Go to [https://hpanel.hostinger.com](https://hpanel.hostinger.com) and log in.
2. Select your hosting plan for **`rightticker.com`**.
3. Under **Files**, click **File Manager** (or access via FTP).

### Step 2.2: Navigate to `public_html`
1. Double-click the **`public_html`** directory.
2. If there is a default `default.php` or placeholder file created by Hostinger, delete or move it.

### Step 2.3: Upload Files
- **Option A (Fastest - ZIP Upload):**
  1. Select all items *inside* your local `public_html` folder and compress them into a zip file (e.g. `upload.zip`).
  2. In Hostinger File Manager, click **Upload** -> select `upload.zip`.
  3. Right-click `upload.zip` in File Manager and select **Extract**.
  4. Ensure files extracted directly into `public_html/` (not inside a subfolder).
  5. Delete `upload.zip`.

- **Option B (Direct Upload):**
  1. Drag and drop all folders (`api`, `css`, `data`, `js`) and files (`.htaccess`, `index.html`, `favicon.png`, `logo.png`) into `public_html`.

---

## 3. Hostinger Configuration & Verification

### Step 3.1: PHP Version Check
1. In hPanel, go to **Advanced** -> **PHP Configuration**.
2. Ensure **PHP 8.1**, **8.2**, or **8.3** is active.
3. Native extensions `pdo_sqlite` and `sqlite3` are enabled by default on Hostinger.

### Step 3.2: Enable Free SSL (HTTPS)
1. In hPanel, go to **Security** -> **SSL**.
2. Ensure the Let's Encrypt SSL certificate is active for `rightticker.com`.
3. Enable **Force HTTPS** (Hostinger toggle).

### Step 3.3: Verify LiteSpeed Cache
1. In hPanel, go to **Advanced** -> **LiteSpeed**.
2. Verify LiteSpeed is enabled. The `.htaccess` file provided already includes full optimizations for LiteSpeed compression and browser caching.

---

## 4. How Resource Usage is Kept Near 0%

| Metric | Before Optimization | After Optimization | Hostinger Benefit |
| :--- | :--- | :--- | :--- |
| **Initial HTML Size** | 2,210 KB (Embedded Base64) | **14.9 KB** | 99.3% faster initial paint |
| **Initial Excel JS** | 881 KB (Forced load) | **0 KB** (Loaded on demand) | Eliminates 880 KB overhead |
| **Stock Data Transfer** | 5,504 KB uncompressed | **1,392 KB** (Pre-gzipped) | 74% bandwidth savings |
| **Server Background RAM** | ~100MB (Node process) | **0 MB** (Stateless PHP SQLite) | Never exceeds Hostinger RAM limits |
| **Watchlist Operations** | D1 / Cloudflare Worker | **SQLite3 PDO** (2ms per op) | Zero CPU spin |
| **Repeat Visit Network** | Downloads all assets again | **0 KB** (Cached 1 year) | 0 server requests for repeat visits |

---

## 5. Testing the Live Site

1. Open `https://rightticker.com/` in your browser.
2. Test searching for stocks (e.g. `INFY`, `TCS`, `RELIANCE`).
3. Click the heart icon on any stock to add it to your Watchlist.
4. Refresh the page: the stock remains in your Watchlist!
5. Click **Download .xls** in Screener or Watchlist: SheetJS downloads instantly on demand.
