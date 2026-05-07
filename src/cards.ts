import * as coda from '@codahq/packs-sdk';
import { requireBody } from './utils';
import { Card, CardsResponse } from './types/webflowTypes';

/**
 * Setup card-related formulas and sync tables
 */
export function setupCards(pack: coda.PackDefinitionBuilder) {
  // Basic card schema
  const CardSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      type: { type: coda.ValueType.String },
      lastUpdated: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
      },
    },
    displayProperty: 'name',
    idProperty: 'id',
    featuredProperties: ['name', 'type'],
  });

  // Add your card-related formulas and sync tables here
  pack.addFormula({
    name: 'ListCards',
    description: 'List all cards in a Webflow site.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'siteId',
        description: 'The ID of the Webflow site.',
      }),
    ],
    resultType: coda.ValueType.Array,
    items: CardSchema,
    execute: async function (
      [siteId]: [string],
      context: coda.ExecutionContext
    ) {
      const url = `https://api.webflow.com/v2/sites/${siteId}/cards`;
      const response = await context.fetcher.fetch<CardsResponse>({
        method: 'GET',
        url,
      });
      const body = requireBody(response.body, 'ListCards');

      return body.cards.map((card: Card) => ({
        id: card._id,
        name: card.name,
        type: card.type,
        lastUpdated: card.lastUpdated,
      }));
    },
  });
}
