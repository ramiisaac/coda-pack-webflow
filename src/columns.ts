import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';
import { CollectionField } from './types/webflowTypes';

/**
 * Column-related sync tables
 */
export function setupColumns(pack: coda.PackDefinitionBuilder) {
  const ColumnSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      order: { type: coda.ValueType.Number },
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
    featuredProperties: ['name', 'order'],
  });

  pack.addSyncTable({
    name: 'Columns',
    description:
      'A table of all collection fields (columns) in your Webflow project.',
    identityName: 'Column',
    schema: ColumnSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncColumns',
      description: 'Sync all fields (columns) from a Webflow collection.',
      parameters: [
        coda.makeParameter({
          type: coda.ParameterType.String,
          name: 'collectionId',
          description: 'The ID of the Webflow collection.',
          example: '605d1b4f5d3c3a74b0d6e123',
        }),
      ],
      execute: async function (
        [collectionId]: [string],
        context: coda.SyncExecutionContext
      ) {
        const url = `https://api.webflow.com/v2/collections/${collectionId}/fields`;
        const fields = await fetchPaginatedData<CollectionField>(url, context);

        return {
          result: fields.map((field) => ({
            id: field.id,
            name: field.displayName ?? field.slug ?? field.id,
            order: field.order || 0,
            createdOn: field.createdOn,
            updatedOn: field.updatedOn,
          })),
        };
      },
    },
  });

  // Custom Column: Status Column with Dropdown Options
  const StatusColumnSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      statusOptions: {
        type: coda.ValueType.Array,
        items: { type: coda.ValueType.String },
        required: true,
        description: 'Dropdown options for the status column.',
      },
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
    featuredProperties: ['name', 'statusOptions'],
  });

  pack.addSyncTable({
    name: 'StatusColumns',
    description: 'A table of status/option fields with predefined options.',
    identityName: 'StatusColumn',
    schema: StatusColumnSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncStatusColumns',
      description:
        'Sync all status/option fields with their options from a Webflow collection.',
      parameters: [
        coda.makeParameter({
          type: coda.ParameterType.String,
          name: 'collectionId',
          description: 'The ID of the Webflow collection.',
          example: '605d1b4f5d3c3a74b0d6e123',
        }),
      ],
      execute: async function (
        [collectionId]: [string],
        context: coda.SyncExecutionContext
      ) {
        const url = `https://api.webflow.com/v2/collections/${collectionId}/fields`;
        const fields = await fetchPaginatedData<CollectionField>(url, context);

        return {
          result: fields
            .filter((field) => field.type === 'Option')
            .map((field) => ({
              id: field.id,
              name: field.displayName ?? field.slug ?? field.id,
              statusOptions: field.validations?.options?.map(
                (opt) => opt.name
              ) || ['Open', 'In Progress', 'Closed'],
              createdOn: field.createdOn,
              updatedOn: field.updatedOn,
            })),
        };
      },
    },
  });
}
