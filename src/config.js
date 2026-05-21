// ─────────────────────────────────────────────────────────────
//  API Configuration
//  All /proxy/* paths route through Vite's dev proxy (vite.config.js)
//  so CORS is handled automatically during development.
// ─────────────────────────────────────────────────────────────

export const NOCODB = {
  BASE_URL: '/proxy/nocodb/api/v2/tables/m9lzzdoc2x4zxun/records',
  TOKEN: 'QXOzKHJ982NgA2AIc8jDqK0lC5CdWEcCwacCIsaJ',
  VIEW_ID: 'vwwsae9mswybppcm',
  // ← Change this to your actual date column name if CreatedAt doesn't work
  DATE_FIELD: 'created_at',
  // ← Change to the actual sub-status field name in your NocoDB table
  SUB_STATUS_FIELD: 'status',
};

export const RAW_MATERIAL = {
  AVERAGES_URL: '/proxy/raw-material/api/v1/average',
  STOCK_URL: '/proxy/raw-material/api/v1/stock',
};

export const CHANNELS = ['Myntra', 'Ajio', 'Nykaa', 'Tatacliq', 'Shopify'];

export const EXCLUDED_SUB_STATUSES = ['New', 'Return', 'Return Checking', 'Missing Pcs'];

// Maps garment size strings → fabric average field name
export const SIZE_TO_AVG_FIELD = {
  XXS: 'average_xxs_xs',
  XS: 'average_xxs_xs',
  S: 'average_s_m',
  M: 'average_s_m',
  L: 'average_l_xl',
  XL: 'average_l_xl',
  '2XL': 'average_2xl_3xl',
  XXL: 'average_2xl_3xl',
  '3XL': 'average_2xl_3xl',
  '4XL': 'average_4xl_5xl',
  '5XL': 'average_4xl_5xl',
};
export const DEFAULT_AVG_FIELD = 'average_s_m';
