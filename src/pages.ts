import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';

/**
 * Pages-related formulas
 */
export function setupPages(pack: coda.PackDefinitionBuilder) {
  const PageSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      slug: { type: coda.ValueType.String },
      createdOn: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
        required: false,
      },
      updatedOn: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
        required: false,
      },
    },
    displayProperty: 'name',
    idProperty: 'id',
    featuredProperties: ['name', 'slug'],
  });

  pack.addSyncTable({
    name: 'Pages',
    description: 'A table of all pages in your Webflow site.',
    identityName: 'Page',
    schema: PageSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncPages',
      description: 'Sync all pages from a Webflow site.',
      parameters: [
        coda.makeParameter({
          type: coda.ParameterType.String,
          name: 'siteId',
          description: 'The ID of the Webflow site.',
          example: '5c8f32c0d1a1c63cbc4bedf7',
        }),
      ],
      execute: async function (
        [siteId]: [string],
        context: coda.SyncExecutionContext
      ) {
        const url = `https://api.webflow.com/v2/sites/${siteId}/pages`;
        const pages = await fetchPaginatedData(url, context);

        return {
          result: pages.map((page: any) => ({
            id: page._id,
            name: page.name,
            slug: page.slug,
            createdOn: page.createdOn,
            updatedOn: page.updatedOn,
          }))
        };
      },
    },
  });
}
