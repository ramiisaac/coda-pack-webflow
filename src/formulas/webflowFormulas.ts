import * as coda from '@codahq/packs-sdk';
import { ApiClient } from '../common/apiClient';
import { WebflowDataApi } from '../modules/webflow/dataApi';
import { WebflowSchemas } from '../schemas/webflowSchemas';
import { Collection, Site } from '../types/webflowTypes';

const AUTH_TOKEN = 'YOUR_WEBFLOW_AUTH_TOKEN';
const apiClient = new ApiClient(coda.makeFetcher());
const webflowApi = new WebflowDataApi(apiClient, AUTH_TOKEN);

// Example Formula: Get Site by ID
coda.pack.addFormula({
  name: 'GetWebflowSite',
  description: 'Fetch a Webflow site by its ID.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'siteId',
      description: 'The ID of the Webflow site.',
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: WebflowSchemas.SiteSchema,
  execute: async function ([siteId], context) {
    const site: Site = await webflowApi.getSite(siteId);
    return site;
  },
});

coda.pack.addFormula({
  name: 'GetWebflowCollections',
  description: 'Fetch collections for a specific Webflow site.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'siteId',
      description: 'The ID of the Webflow site.',
    }),
  ],
  resultType: coda.ValueType.Array,
  items: WebflowSchemas.CollectionSchema,
  execute: async function ([siteId], context) {
    const collections: Collection[] = await webflowApi.getCollections(siteId);
    return collections;
  },
});
