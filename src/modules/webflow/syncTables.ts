import { pack } from '../../pack';
import { WebflowDataApi } from './dataApi';
import { WEBFLOW_DATA_API } from '../../constants/paths';
import { Site, Collection } from '../../types/webflowTypes';
import { WebflowSchemas } from '../../schemas/webflowSchemas';
import { ApiClient } from '../../common/apiClient';

// It's recommended to securely manage your auth token, possibly using environment variables or Coda's secure storage.
const AUTH_TOKEN = 'YOUR_WEBFLOW_AUTH_TOKEN'; // Replace with a secure method

const apiClient = new ApiClient(pack.fetcher);
const webflowApi = new WebflowDataApi(apiClient, AUTH_TOKEN);

// Sync Table for Sites
pack.addSyncTable({
  name: 'Webflow Sites',
  identityName: 'Site',
  schema: WebflowSchemas.SiteSchema,
  formula: {
    name: 'SyncWebflowSites',
    description: 'Syncs Webflow sites',
    parameters: [],
    execute: async function ([], context) {
      const sites: Site[] = await webflowApi.getSites();
      return {
        result: sites,
      };
    },
    maxUpdateBatchSize: 1,
    executeUpdate: async function (args, updates, context) {
      const update = updates[0];
      const { previousValue, newValue } = update;
      // Implement update logic if API supports it
      // For example, updating site name
      // Currently, Webflow doesn't support updating sites via API
      return {
        result: [newValue],
      };
    },
  },
});

// Sync Table for Collections
pack.addSyncTable({
  name: 'Webflow Collections',
  identityName: 'Collection',
  schema: WebflowSchemas.CollectionSchema,
  formula: {
    name: 'SyncWebflowCollections',
    description: 'Syncs Webflow collections for a specific site',
    parameters: [
      pack.makeParameter({
        type: coda.ParameterType.String,
        name: 'siteId',
        description: 'The ID of the Webflow site',
      }),
    ],
    execute: async function ([siteId], context) {
      const collections: Collection[] = await webflowApi.getCollections(siteId);
      return {
        result: collections,
      };
    },
    maxUpdateBatchSize: 10,
    executeUpdate: async function (args, updates, context) {
      // Implement batch update logic if API supports it
      // Currently, Webflow API may have limited support for updating collections
      return {
        result: updates.map(update => update.newValue),
      };
    },
  },
});

// ... existing code ... 