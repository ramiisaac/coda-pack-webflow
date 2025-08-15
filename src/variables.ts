import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData, getErrorMessage } from './utils';

/**
 * Variable-related formulas
 */
export function setupVariables(pack: coda.PackDefinitionBuilder) {
  const VariableSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      value: { type: coda.ValueType.String },
      createdOn: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
      },
      updatedOn: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
      },
    },
    displayProperty: 'name',
    idProperty: 'id',
    featuredProperties: ['name', 'value'],
  });

  pack.addFormula({
    name: 'ListVariables',
    description: 'List all design variables in the Webflow site.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the Variables collection.',
        example: '605d1b4f5d3c3a74b0d6e123',
      }),
    ],
    resultType: coda.ValueType.Array,
    items: VariableSchema,
    execute: async function ([collectionId]: [string], context: coda.ExecutionContext) {
      const url = `https://api.webflow.com/v2/collections/${collectionId}/items`;
      const variables = await fetchPaginatedData(url, context);

      return variables.map((variable: any) => ({
        id: variable._id,
        name: variable.name,
        value: variable.value,
        createdOn: variable.createdOn,
        updatedOn: variable.updatedOn,
      }));
    },
  });

  pack.addFormula({
    name: 'CreateVariable',
    description: 'Create a new design variable in the Webflow site.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the Variables collection.',
        example: '605d1b4f5d3c3a74b0d6e123',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'name',
        description: 'The name of the variable.',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'value',
        description: 'The value of the variable.',
      }),
    ],
    resultType: coda.ValueType.Object,
    schema: VariableSchema,
    execute: async function ([collectionId, name, value]: [string, string, string], context: coda.ExecutionContext) {
      const url = `https://api.webflow.com/v2/collections/${collectionId}/items`;
      const response = await context.fetcher.fetch({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Version': '1.0.0',
        },
        body: JSON.stringify({
          fields: {
            name: name,
            value: value,
            _archived: false,
            _draft: false,
          },
        }),
      });

      if (response.status !== 201) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      return response.body;
    },
  });

  pack.addFormula({
    name: 'UpdateVariable',
    description: 'Update an existing design variable in the Webflow site.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the Variables collection.',
        example: '605d1b4f5d3c3a74b0d6e123',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'variableId',
        description: 'The ID of the variable to update.',
        example: '606d1b5f6d4c4b85c1e7f456',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'value',
        description: 'The new value of the variable.',
      }),
    ],
    resultType: coda.ValueType.Object,
    schema: VariableSchema,
    execute: async function ([collectionId, variableId, value]: [string, string, string], context: coda.ExecutionContext) {
      const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${variableId}`;
      const response = await context.fetcher.fetch({
        method: 'PATCH',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Version': '1.0.0',
        },
        body: JSON.stringify({
          fields: {
            value: value,
          },
        }),
      });

      if (response.status !== 200) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      return response.body;
    },
  });
}
