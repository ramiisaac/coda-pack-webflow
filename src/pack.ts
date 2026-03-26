import * as coda from '@codahq/packs-sdk';
import {
  WEBFLOW_API_BASE,
  WEBFLOW_OAUTH,
  WEBFLOW_DATA_API,
} from './constants/paths';

/**
 * Webflow API Coda Pack
 *
 * A comprehensive Coda Pack for Webflow API integration that provides:
 * - Site management and data retrieval
 * - CMS content sync tables for collections, pages, forms
 * - E-commerce integration for orders and product data
 * - Design variable management
 * - Secure OAuth2 authentication
 *
 * Features:
 * - Multiple sync tables for different Webflow data types
 * - Formulas for direct API interactions
 * - Proper error handling and retry logic
 * - Support for pagination and rate limiting
 */

// Create the pack
export const pack = coda.newPack();

// Define pack metadata and OAuth2 authentication
pack.setUserAuthentication({
  type: coda.AuthenticationType.OAuth2,
  authorizationUrl: WEBFLOW_OAUTH.AUTHORIZE_URL,
  tokenUrl: WEBFLOW_OAUTH.TOKEN_URL,
  scopes: [
    'sites:read',
    'sites:write',
    'cms:read',
    'cms:write',
    'ecommerce:read',
    'ecommerce:write',
  ],
  getConnectionName: async function (context) {
    try {
      // Get user's sites to display a friendly connection name
      const response = await context.fetcher.fetch({
        method: 'GET',
        url: WEBFLOW_DATA_API.GET_SITES,
        headers: {
          'Accept-Version': '1.0.0',
        },
      });
      const sites = response.body;
      return (
        (Array.isArray(sites) && sites.length > 0 && sites[0]?.name) ||
        'Webflow User'
      );
    } catch (error) {
      // Fallback to generic name if API call fails
      return 'Webflow User';
    }
  },
});

// Add network domains for security
pack.addNetworkDomain('api.webflow.com');

// Import and setup all the pack components
import { setupSyncTables } from './syncTables';
import { setupFormulas } from './formulas/webflowFormulas';

// Setup all sync tables and formulas
setupSyncTables(pack);
setupFormulas(pack);
