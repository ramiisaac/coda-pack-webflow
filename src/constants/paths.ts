// Define all API endpoints and other constant paths here

export const WEBFLOW_API_BASE = 'https://api.webflow.com';

// Data API Endpoints
export const WEBFLOW_DATA_API = {
  GET_SITES: `${WEBFLOW_API_BASE}/sites`,
  GET_SITE: (siteId: string) => `${WEBFLOW_API_BASE}/sites/${siteId}`,
  GET_COLLECTIONS: (siteId: string) => `${WEBFLOW_API_BASE}/sites/${siteId}/collections`,
};
