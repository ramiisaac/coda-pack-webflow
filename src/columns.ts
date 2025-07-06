import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';

/**
 * Column-related sync tables
 */
export function setupColumns(pack: coda.PackBuilder) {
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
    description: 'A table of all columns in your Webflow project.',
    identityName: 'Column',
    schema: ColumnSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncColumns',
      description: 'Sync all columns from a Webflow project.',
      parameters: [
        coda.makeParameter({
          type: coda.ParameterType.String,
          name: 'collectionId',
          description: 'The ID of the Columns collection.',
          example: '605d1b4f5d3c3a74b0d6e123',
        }),
      ],
      execute: async function (
        [collectionId]: [string],
        context: coda.ExecutionContext
      ): Promise<any[]> {
        const url = `https://api.webflow.com/v2/collections/${collectionId}/items`;
        const columns = await fetchPaginatedData(url, context);

        return columns.map((column: any) => ({
          id: column._id,
          name: column.name,
          order: column.order || 0,
          createdOn: column.createdOn,
          updatedOn: column.updatedOn,
        }));
      },
    },
  });

  // Custom Column: Status Column with Dropdown Options
  const StatusColumnSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      statusOptions: {
        type: coda.ValueType.String,
        array: true,
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
    description: 'A table of status columns with predefined options.',
    identityName: 'StatusColumn',
    schema: StatusColumnSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncStatusColumns',
      description:
        'Sync all status columns with their options from a Webflow project.',
      parameters: [
        coda.makeParameter({
          type: coda.ParameterType.String,
          name: 'collectionId',
          description: 'The ID of the Columns collection.',
          example: '605d1b4f5d3c3a74b0d6e123',
        }),
      ],
      execute: async function (
        [collectionId]: [string],
        context: coda.ExecutionContext
      ): Promise<any[]> {
        const url = `https://api.webflow.com/v2/collections/${collectionId}/items`;
        const columns = await fetchPaginatedData(url, context);

        return columns.map((column: any) => ({
          id: column._id,
          name: column.name,
          statusOptions: column.statusOptions || [
            'Open',
            'In Progress',
            'Closed',
          ],
          createdOn: column.createdOn,
          updatedOn: column.updatedOn,
        }));
      },
    },
  });
}
