import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData, getErrorMessage, requireBody } from './utils';
import {
  Collection,
  CollectionItem,
  CollectionItemRequestBody,
} from './types/webflowTypes';

/**
 * Collection-related formulas
 */
export function setupCollections(pack: coda.PackDefinitionBuilder) {
  const CollectionSchema = coda.makeObjectSchema({
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

  pack.addFormula({
    name: 'ListCollections',
    description: 'List all CMS collections for a Webflow site.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'siteId',
        description: 'The ID of the Webflow site.',
        example: '5c8f32c0d1a1c63cbc4bedf7',
      }),
    ],
    resultType: coda.ValueType.Array,
    items: CollectionSchema,
    execute: async function (
      [siteId]: [string],
      context: coda.ExecutionContext
    ) {
      const url = `https://api.webflow.com/v2/sites/${siteId}/collections`;
      const collections = await fetchPaginatedData<Collection>(
        url,
        context,
        true
      );

      return collections.map((collection) => ({
        id: collection._id,
        name: collection.name,
        slug: collection.slug,
        createdOn: collection.createdOn,
        updatedOn: collection.updatedOn,
      }));
    },
  });

  pack.addFormula({
    name: 'CreateCollectionItem',
    description: 'Create a new item in a CMS collection.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the CMS collection.',
        example: '605d1b4f5d3c3a74b0d6e123',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'name',
        description: 'The name of the item.',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'slug',
        description: 'The slug for the item.',
        optional: true,
      }),
    ],
    resultType: coda.ValueType.Object,
    schema: CollectionSchema,
    execute: async function (
      [collectionId, name, slug]: [string, string, string | undefined],
      context: coda.ExecutionContext
    ) {
      const url = `https://api.webflow.com/v2/collections/${collectionId}/items`;
      const response = await context.fetcher.fetch<CollectionItem>({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Version': '1.0.0',
        },
        body: JSON.stringify({
          fields: {
            name: name,
            slug: slug,
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

      const item = requireBody(response.body, 'CreateCollectionItem');
      return {
        id: item._id,
        name: item.name,
        slug: item.slug,
        createdOn: item.createdOn,
        updatedOn: item.updatedOn,
      };
    },
  });

  pack.addFormula({
    name: 'UpdateCollectionItem',
    description: 'Update an existing item in a CMS collection.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the CMS collection.',
        example: '605d1b4f5d3c3a74b0d6e123',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'itemId',
        description: 'The ID of the CMS collection item.',
        example: '606d1b5f6d4c4b85c1e7f456',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'name',
        description: 'The new name of the item.',
        optional: true,
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'slug',
        description: 'The new slug for the item.',
        optional: true,
      }),
    ],
    resultType: coda.ValueType.Object,
    schema: CollectionSchema,
    execute: async function (
      [collectionId, itemId, name, slug]: [
        string,
        string,
        string | undefined,
        string | undefined,
      ],
      context: coda.ExecutionContext
    ) {
      const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`;
      const body: CollectionItemRequestBody = {
        fields: {
          _archived: false,
          _draft: false,
        },
      };

      if (name !== undefined) body.fields.name = name;
      if (slug !== undefined) body.fields.slug = slug;

      const response = await context.fetcher.fetch<CollectionItem>({
        method: 'PATCH',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Version': '1.0.0',
        },
        body: JSON.stringify(body),
      });

      if (response.status !== 200) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      const item = requireBody(response.body, 'UpdateCollectionItem');
      return {
        id: item._id,
        name: item.name,
        slug: item.slug,
        createdOn: item.createdOn,
        updatedOn: item.updatedOn,
      };
    },
  });

  pack.addFormula({
    name: 'DeleteCollectionItem',
    description: 'Delete an item from a CMS collection.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the CMS collection.',
        example: '605d1b4f5d3c3a74b0d6e123',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'itemId',
        description: 'The ID of the CMS collection item.',
        example: '606d1b5f6d4c4b85c1e7f456',
      }),
    ],
    resultType: coda.ValueType.Boolean,
    execute: async function (
      [collectionId, itemId]: [string, string],
      context: coda.ExecutionContext
    ): Promise<boolean> {
      const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`;
      const response = await context.fetcher.fetch({
        method: 'DELETE',
        url: url,
        headers: {
          'Accept-Version': '1.0.0',
        },
      });

      if (response.status !== 204) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      return true;
    },
  });

  pack.addFormula({
    name: 'DeleteAllCollectionItems',
    description: 'Deletes all items from a specified CMS collection.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the CMS collection.',
        example: '605d1b4f5d3c3a74b0d6e123',
      }),
    ],
    resultType: coda.ValueType.Boolean,
    execute: async function (
      [collectionId]: [string],
      context: coda.ExecutionContext
    ): Promise<boolean> {
      const items = await fetchPaginatedData<CollectionItem>(
        `https://api.webflow.com/v2/collections/${collectionId}/items`,
        context
      );
      const deletePromises = items.map((item) =>
        context.fetcher.fetch({
          method: 'DELETE',
          url: `https://api.webflow.com/v2/collections/${collectionId}/items/${item._id}`,
          headers: { 'Accept-Version': '1.0.0' },
        })
      );
      await Promise.all(deletePromises);
      return true;
    },
  });

  pack.addFormula({
    name: 'GetCollectionItem',
    description: 'Get a specific CMS collection item by ID.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'collectionId',
        description: 'The ID of the CMS collection.',
      }),
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'itemId',
        description: 'The ID of the collection item.',
      }),
    ],
    resultType: coda.ValueType.Object,
    schema: CollectionSchema,
    execute: async function (
      [collectionId, itemId]: [string, string],
      context: coda.ExecutionContext
    ) {
      const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`;
      const response = await context.fetcher.fetch<CollectionItem>({
        method: 'GET',
        url,
      });

      if (response.status !== 200) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      const item = requireBody(response.body, 'GetCollectionItem');
      return {
        id: item._id,
        name: item.name,
        slug: item.slug,
        createdOn: item.createdOn,
        updatedOn: item.updatedOn,
      };
    },
  });
}
