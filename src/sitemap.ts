import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';

/**
 * Sync table for Webflow Sitemap
 */
export function setupSitemap(pack: coda.PackDefinitionBuilder) {
  const SitemapSchema = coda.makeObjectSchema({
    properties: {
      url: { type: coda.ValueType.String, required: true },
      lastModified: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
      },
    },
    displayProperty: 'url',
    idProperty: 'url',
    featuredProperties: ['url', 'lastModified'],
  });

  pack.addSyncTable({
    name: 'Sitemap',
    description: "A table of all URLs in your Webflow site's sitemap.",
    identityName: 'SitemapEntry',
    schema: SitemapSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncSitemap',
      description: 'Sync all sitemap entries from a Webflow site.',
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
        const url = `https://api.webflow.com/v2/sites/${siteId}/sitemap`;
        const sitemap = await fetchPaginatedData(url, context);

        return {
          result: sitemap.map((entry: any) => ({
            url: entry.url,
            lastModified: entry.lastModified,
          }))
        };
      },
    },
  });
}
