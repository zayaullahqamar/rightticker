# Excel Data Import & Synchronization Guide

The stock data on RightTicker is derived from an Excel workbook snapshot (e.g. `Sample.xlsx`) containing 2,559 NSE tickers, financial metrics, and 60 days of historical prices.

---

## 1. How to Import New Workbook Data

When you receive an updated Excel file:

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "C:\Users\hp\Desktop\Right ticker"
   ```

2. Run the import script with Python:
   ```powershell
   python scripts/import-database.py "path/to/YourNewWorkbook.xlsx"
   ```

3. Move the generated `stocks-data.js` to your deployment directory:
   ```powershell
   Copy-Item "public_html/data/stocks-data.js" -Destination "public_html/data/stocks-data.js" -Force
   ```

4. Re-run the pre-compression script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "scripts/build-optimize.ps1"
   ```

5. Upload the updated `public_html/data/stocks-data.js` and `public_html/data/stocks-data.js.gz` to Hostinger via File Manager.

---

## 2. Column Mapping Details

- **Row 1:** Column headers.
- **Columns A–AN:** Company metrics, valuation multiples, and indicators.
- **Columns AO onward:** Chronological daily price history (newest first). The first 60 historical sessions feed the interactive sparklines, 5,000-run Monte Carlo simulation, and tabular history.
- **Missing or blank values:** Retained as `null` or `Not Available`.
