import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';

/**
 * Ecommerce-related formulas
 */
export function setupEcommerce(pack: coda.PackBuilder) {
  const OrderSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      email: { type: coda.ValueType.String, required: true },
      total: { type: coda.ValueType.Number, required: true },
      status: { type: coda.ValueType.String, required: true },
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
    displayProperty: 'email',
    idProperty: 'id',
    featuredProperties: ['email', 'total', 'status'],
  });

  pack.addSyncTable({
    name: 'Orders',
    description: 'A table of all orders in your Webflow Ecommerce store.',
    identityName: 'Order',
    schema: OrderSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncOrders',
      description: 'Sync all orders from your Webflow Ecommerce store.',
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
        context: coda.ExecutionContext
      ): Promise<any[]> {
        const url = `https://api.webflow.com/v2/sites/${siteId}/orders`;
        const orders = await fetchPaginatedData(url, context, true);

        return orders.map((order: any) => ({
          id: order._id,
          email: order.email,
          total: parseFloat(order.total),
          status: order.status,
          createdOn: order.createdOn,
          updatedOn: order.updatedOn,
        }));
      },
    },
  });

  // Additional ecommerce-related formulas can be added here
}
