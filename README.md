# 🧵 Fabric Analysis Dashboard

**Order Demand & Stock Report — React + Vite + Tailwind CSS**

A professional internal dashboard that fetches pending orders from NocoDB, calculates fabric consumption per style & size, and flags fabrics that are running low on stock (less than 7-day supply).

---

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Features](#features)
- [API Reference](#api-reference)
- [Data Flow](#data-flow)
- [Exporting to Excel](#exporting-to-excel)

---

## How It Works

The dashboard runs a **5-step analysis pipeline** every time you click **Run Analysis**:

```
Step 1: Fetch Orders (NocoDB)
         ↓
Step 2: Post-filter by Channel & Status (JavaScript)
         ↓
Step 3: Fetch Fabric Averages (raw-material-backend API)
         ↓
Step 4: Calculate Total Fabric Demand per Style + Size
         ↓
Step 5: Fetch Stock Levels & Check 7-Day Adequacy
         ↓
        📊 Dashboard Results
```

### Step 1 — Fetch Orders from NocoDB

Queries the NocoDB table with a simple filter:

```
(status,eq,pending)
~and(created_at,gt,exactDate,{startDate - 1 day})
~and(created_at,lt,exactDate,{endDate + 1 day})
```

> **Why shift by 1 day?** NocoDB only supports `gt` (greater than) and `lt` (less than), not `gte`/`lte`. Shifting ensures the selected start and end dates are **included** in results.

Pagination is handled automatically — fetches 1000 records per page until all records are loaded.

---

### Step 2 — Post-filter in JavaScript

After all pages are fetched, JavaScript filters the results:

- **Keep** only records where `channel` is one of: `Myntra`, `Ajio`, `Nykaa`, `Tatacliq`, `Shopify`
- **Remove** records where `status` is: `New`, `Return`, `Return Checking`, `Missing Pcs`

> This filtering is done in JS (not in NocoDB query) to avoid query parsing errors with complex compound filters.

---

### Step 3 — Fetch Fabric Averages

Calls `https://raw-material-backend.onrender.com/api/v1/average` which returns fabric consumption averages per style and size group:

| Size Group | Field Name |
|---|---|
| XXS, XS | `average_xxs_xs` |
| S, M | `average_s_m` |
| L, XL | `average_l_xl` |
| 2XL, XXL, 3XL | `average_2xl_3xl` |
| 4XL, 5XL | `average_4xl_5xl` |

---

### Step 4 — Calculate Fabric Demand

For every `(style_number, size)` combination found in orders:

```
Total Metres = Order Count × Fabric Average (for that size group)
```

If a style has **multiple fabrics** (e.g. outer + lining), the metres are summed across all fabrics.

Example:
```
Style 19703, Size XL → 50 orders × average_l_xl (2.1m) = 105 metres
```

---

### Step 5 — Stock Adequacy Check (7-Day Rule)

For each fabric in stock:

```
Daily Demand   = Total Period Demand ÷ Period Days
7-Day Demand   = Daily Demand × 7
⚠ ALERT if    Available Stock < 7-Day Demand
```

> **Note:** Since the fabric averages API does not include `fabricNumber`, demand is approximated as the **mean across all fabric entries** for each contributing style. This is a conservative estimate.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| HTTP Client | Axios |
| Date Utilities | date-fns |
| Icons | Lucide React |
| Excel Export | SheetJS (xlsx) |
| Dev Proxy | Vite proxy (handles CORS) |

---

## Project Structure

```
fabric-analysis-app/
├── index.html                    # Entry HTML
├── vite.config.js                # Vite config + dev proxy
├── tailwind.config.js            # Tailwind theme config
├── postcss.config.js             # PostCSS config
├── package.json
└── src/
    ├── main.jsx                  # React entry point
    ├── index.css                 # Tailwind base styles
    ├── App.jsx                   # Root component + state management
    ├── config.js                 # ⚙️  API endpoints, field names, constants
    │
    ├── api/
    │   └── index.js              # All API calls + runAnalysis() pipeline
    │
    ├── utils/
    │   ├── transform.js          # Data transformation & calculations
    │   └── export.js             # Excel export logic (SheetJS)
    │
    └── components/
        ├── Header.jsx            # Sticky top nav: date picker + buttons
        ├── SummaryCards.jsx      # 4 KPI cards (orders, styles, metres, alerts)
        ├── TabNav.jsx            # Tab bar with alert badge
        ├── DataTable.jsx         # Reusable: sortable + searchable + paginated
        ├── OrdersTable.jsx       # Tab 1: Style × Size × Channel breakdown
        ├── FabricUsageTable.jsx  # Tab 2: Fabric metres per style+size
        ├── StockAlertsTable.jsx  # Tab 3: Fabrics below 7-day supply
        ├── FullStockTable.jsx    # Tab 4: All fabrics with status
        ├── LoadingState.jsx      # Animated step-by-step progress
        └── EmptyState.jsx        # Welcome screen
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm 9+

### Install

```bash
# Navigate to the project folder
cd "SACHIN WORKSPACES/raw material feature/fabric-analysis-app"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Configuration

All settings are in **`src/config.js`**. Edit this file to match your NocoDB table:

```js
export const NOCODB = {
  BASE_URL:         '/proxy/nocodb/api/v2/tables/m9lzzdoc2x4zxun/records',
  TOKEN:            'your-nocodb-token',
  VIEW_ID:          'your-view-id',
  DATE_FIELD:       'created_at',    // ← Your date column name in NocoDB
  SUB_STATUS_FIELD: 'status',        // ← Column used for status exclusions
}
```

### Key fields to verify:

| Field | Default | What it does |
|---|---|---|
| `DATE_FIELD` | `created_at` | Column used for date range filtering |
| `SUB_STATUS_FIELD` | `status` | Column checked against `EXCLUDED_SUB_STATUSES` |
| `CHANNELS` | Myntra, Ajio, Nykaa, Tatacliq, Shopify | Only these channels are included in results |
| `EXCLUDED_SUB_STATUSES` | New, Return, Return Checking, Missing Pcs | Records with these status values are excluded |

### Dev Proxy (CORS)

The Vite dev proxy in `vite.config.js` routes all API calls through `localhost:3000` to avoid CORS errors:

| Proxy Path | Target |
|---|---|
| `/proxy/nocodb/*` | `https://nocodb.qurvii.com` |
| `/proxy/raw-material/*` | `https://raw-material-backend.onrender.com` |

> This proxy only works during development (`npm run dev`). For production deployment, configure CORS headers on the backend servers or set up a server-side proxy.

---

## Running the App

```bash
# Development (with hot reload + proxy)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Features

### Dashboard Tabs

| Tab | Description |
|---|---|
| **Orders by Style & Channel** | Each (style, size) row with order counts broken down by Myntra, Ajio, Nykaa, Tatacliq, Shopify + total |
| **Fabric Usage** | Total metres required per (style, size) with fabric count and avg field used |
| **⚠ Stock Alerts** | Only fabrics below 7-day supply, sorted by worst shortfall first |
| **Full Stock Report** | All fabric stocks with available metres, 7-day requirement, and OK/LOW STOCK status |

### All Tables Support

- 🔍 **Search** — filter rows by any text
- 🔃 **Sort** — click any column header to sort ascending/descending
- 📄 **Pagination** — 100 rows per page for large datasets

### Summary Cards

| Card | Value |
|---|---|
| Total Pending Orders | Count of orders after all filters |
| Unique Styles | Number of distinct style numbers |
| Total Fabric Demand | Sum of all metres across all styles and sizes |
| Stock Alerts | Count of fabrics with insufficient 7-day supply |

---

## API Reference

### NocoDB — Orders

```
GET https://nocodb.qurvii.com/api/v2/tables/m9lzzdoc2x4zxun/records
```

**Query params used:**

| Param | Value |
|---|---|
| `where` | `(status,eq,pending)~and(created_at,gt,exactDate,{d-1})~and(created_at,lt,exactDate,{d+1})` |
| `limit` | `1000` |
| `offset` | `0, 1000, 2000, …` (paginated) |
| `viewId` | `vwwsae9mswybppcm` |

**Response fields used:** `channel`, `style_number`, `size`, `status`, `order_id`

---

### Fabric Averages

```
GET https://raw-material-backend.onrender.com/api/v1/average
```

Returns all style averages. Used to look up `average_xxs_xs`, `average_s_m`, `average_l_xl`, `average_2xl_3xl`, `average_4xl_5xl` per style.

---

### Fabric Stocks

```
GET https://raw-material-backend.onrender.com/api/v1/stock
```

Returns all fabric stock records with `fabricNumber`, `fabricName`, `availableStock`, `styleNumbers[]`.

---

## Data Flow

```
NocoDB Orders API
      │
      ▼
fetchAllOrders()   ← paginated, status+date filter in query
      │
      ▼
applyPostFilters() ← channel filter + status exclusion in JS
      │
      ├──────────────────────────────────────┐
      ▼                                      ▼
transformOrders()                    Averages API + Stocks API
{ style: { size: { channel: count }}}       │
      │                                      │
      ▼                                      │
buildStyleUsage() ◄────────────────────────┘
{ style: { size: { totalMetres, perFabric[] }}}
      │
      ▼
analyseStocks()
{ fabricNumber, availableStock, 7dayReq, isAlert }
      │
      ▼
   Dashboard
```

---

## Exporting to Excel

Click the **Export Excel** button (appears after running analysis) to download a `.xlsx` file with 4 sheets:

1. **Orders by Style & Channel** — same as Tab 1
2. **Fabric Usage** — same as Tab 2
3. **⚠ Stock Alerts** — only alerted fabrics
4. **Full Stock Report** — all stocks

Export is done entirely in the browser using SheetJS — no backend required.

---

## Notes

- The **7-day stock adequacy check** uses the selected period's daily demand rate as a proxy for future demand. If the selected date range is very short (e.g. 1–2 days), the projection may be skewed.
- Fabric demand approximation uses the **mean of all fabric entries** per style because the fabric averages API does not expose `fabricNumber`. This is a known limitation.
- The `size` value `UNKNOWN` appears when an order has no size set in NocoDB.
