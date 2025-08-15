import * as coda from '@codahq/packs-sdk';
import { WebflowSchemas } from '../schemas/webflowSchemas';
import { fetchPaginatedData } from '../utils';

/**
 * Setup formulas for Webflow API interactions
 */
export function setupFormulas(pack: coda.PackDefinitionBuilder) {
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
    execute: async function ([siteId]: [string], context: coda.ExecutionContext) {
      const url = `https://api.webflow.com/sites/${siteId}`;
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
    execute: async function ([siteId]: [string], context: coda.ExecutionContext) {
      const url = `https://api.webflow.com/sites/${siteId}/collections`;
      const collections = await fetchPaginatedData(url, context);
      return collections;
    },
  });
}
