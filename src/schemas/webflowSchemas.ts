// Define schemas for Webflow data

import * as coda from '@codahq/packs-sdk';

export const WebflowSchemas = {
  SiteSchema: coda.makeObjectSchema({
    properties: {
      _id: { type: coda.ValueType.String, required: true, fromKey: '_id' },
      name: { type: coda.ValueType.String, required: true, fromKey: 'name' },
      createdOn: { type: coda.ValueType.String, fromKey: 'createdOn' },
      lastPublishedOn: { type: coda.ValueType.String, fromKey: 'lastPublishedOn' },
      // Add more site properties as needed
    },
    displayProperty: 'name',
    idProperty: '_id',
  }),

  CollectionSchema: coda.makeObjectSchema({
    properties: {
      _id: { type: coda.ValueType.String, required: true, fromKey: '_id' },
      name: { type: coda.ValueType.String, required: true, fromKey: 'name' },
      slug: { type: coda.ValueType.String, fromKey: 'slug' },
      createdOn: { type: coda.ValueType.String, fromKey: 'createdOn' },
      updatedOn: { type: coda.ValueType.String, fromKey: 'updatedOn' },
      // Add more collection properties as needed
    },
    displayProperty: 'name',
    idProperty: '_id',
  }),
};

// ... existing code ... 