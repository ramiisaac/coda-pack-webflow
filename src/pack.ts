import { coda } from '@codahq/packs-sdk';
import './modules/webflow/dataApi';
import './modules/webflow/syncTables';
import './formulas/webflowFormulas';

// Define pack metadata
coda.pack.setUserAuthentication({
  type: coda.AuthenticationType.OAuth2,
  authorizationUrl: 'https://api.webflow.com/oauth/authorize',
  tokenUrl: 'https://api.webflow.com/oauth/access_token',
  scopes: ['full.access'],
  // Implement getConnectionName as needed
  getConnectionName: async function (context) {
    // Example implementation
    const response = await context.fetcher.fetch({
      method: 'GET',
      url: 'https://api.webflow.com/sites',
      headers: {
        Authorization: `Bearer YOUR_WEBFLOW_AUTH_TOKEN`,
        'Accept-Version': '1.0.0',
      },
    });
    const sites = response.body;
    return sites.length > 0 ? sites[0].name : 'Webflow User';
  },
});

// Add more pack configurations or initializations as needed

// Example: Define a simple schema or add more features
// coda.pack.addFormula({ ... });
// coda.pack.addSyncTable({ ... });
