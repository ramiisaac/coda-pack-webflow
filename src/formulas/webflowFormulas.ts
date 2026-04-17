import * as coda from '@codahq/packs-sdk';
import { WebflowSchemas } from '../schemas/webflowSchemas';
import { fetchPaginatedData } from '../utils';
import { WEBFLOW_DATA_API } from '../constants/paths';

/**
 * Setup formulas for Webflow API interactions
 */
export function setupFormulas(pack: coda.PackDefinitionBuilder) {
  pack.addFormula({
    name: 'ListWebflowSites',
    description: 'List the Webflow sites available to the connected account.',
    parameters: [],
    resultType: coda.ValueType.Array,
    items: WebflowSchemas.SiteSchema,
    execute: async function (_params, context: coda.ExecutionContext) {
      const response = await context.fetcher.fetch({
        method: 'GET',
        url: WEBFLOW_DATA_API.GET_SITES,
        headers: {
          'Accept-Version': '1.0.0',
        },
      });
      return Array.isArray(response.body) ? response.body : [];
    },
  });

  // Formula: Get Site by ID
  pack.addFormula({
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
    execute: async function (
      [siteId]: [string],
      context: coda.ExecutionContext
    ) {
      const url = WEBFLOW_DATA_API.GET_SITE(siteId);
      const response = await context.fetcher.fetch({
        method: 'GET',
        url: url,
        headers: {
          'Accept-Version': '1.0.0',
        },
      });
      return response.body;
    },
  });

  // Formula: Get Collections for a Site
  pack.addFormula({
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
    execute: async function (
      [siteId]: [string],
      context: coda.ExecutionContext
    ) {
      const url = WEBFLOW_DATA_API.GET_COLLECTIONS(siteId);
      const collections = await fetchPaginatedData(url, context);
      return collections;
    },
  });
}
