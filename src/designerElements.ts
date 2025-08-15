import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';

/**
 * Sync table for Webflow Designer elements
 */
export function setupDesignerElements(pack: coda.PackDefinitionBuilder) {
  const DesignerElementSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      type: { type: coda.ValueType.String },
      text: { type: coda.ValueType.String },
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
    featuredProperties: ['name', 'type', 'text'],
  });

  pack.addSyncTable({
    name: 'DesignerElements',
    description: 'A table of all elements in your Webflow Designer.',
    identityName: 'DesignerElement',
    schema: DesignerElementSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncDesignerElements',
      description: 'Sync all designer elements from a Webflow site.',
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
        const url = `https://api.webflow.com/v2/sites/${siteId}/designer/elements`;
        const elements = await fetchPaginatedData(url, context);

        return {
          result: elements.map((element: any) => ({
            id: element._id,
            name: element.name,
            type: element.type,
            text: element.text,
            createdOn: element.createdOn,
            updatedOn: element.updatedOn,
          }))
        };
      },
    },
  });
}
