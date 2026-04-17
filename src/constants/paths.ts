// Define all API endpoints and other constant paths here

export const WEBFLOW_API_BASE = 'https://api.webflow.com';

// OAuth Endpoints
export const WEBFLOW_OAUTH = {
  AUTHORIZE_URL: 'https://webflow.com/oauth/authorize',
  TOKEN_URL: `${WEBFLOW_API_BASE}/oauth/access_token`,
};

// Data API Endpoints
export const WEBFLOW_DATA_API = {
  GET_SITES: `${WEBFLOW_API_BASE}/sites`,
  GET_SITE: (siteId: string) => `${WEBFLOW_API_BASE}/sites/${siteId}`,
  GET_COLLECTIONS: (siteId: string) =>
    `${WEBFLOW_API_BASE}/sites/${siteId}/collections`,
};

// Ecommerce API Endpoints
export const WEBFLOW_ECOMMERCE_API = {
  GET_ORDERS: (siteId: string) =>
    `${WEBFLOW_API_BASE}/v2/sites/${siteId}/orders`,
};
