import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';

/**
 * Order Details-related formulas
 */
export function setupOrderDetails(pack: coda.PackBuilder) {
  const OrderDetailSchema = coda.makeObjectSchema({
    properties: {
      orderId: { type: coda.ValueType.String, required: true },
      productName: { type: coda.ValueType.String, required: true },
      quantity: { type: coda.ValueType.Number, required: true },
      price: { type: coda.ValueType.Number, required: true },
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
    displayProperty: 'productName',
    idProperty: 'orderId',
    featuredProperties: ['productName', 'quantity', 'price'],
  });

  pack.addSyncTable({
    name: 'OrderDetails',
    description:
      'A table of all order details in your Webflow Ecommerce store.',
    identityName: 'OrderDetail',
    schema: OrderDetailSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncOrderDetails',
      description: 'Sync all order details from your Webflow Ecommerce store.',
      parameters: [
        coda.makeParameter({
          type: coda.ParameterType.String,
          name: 'orderId',
          description: 'The ID of the order.',
          example: '606d1b5f6d4c4b85c1e7f456',
        }),
      ],
      execute: async function (
        [orderId]: [string],
        context: coda.ExecutionContext
      ): Promise<any[]> {
        const url = `https://api.webflow.com/v2/orders/${orderId}/items`;
        const orderDetails = await fetchPaginatedData(url, context);

        return orderDetails.map((detail: any) => ({
          orderId: orderId,
          productName: detail.productName,
          quantity: detail.quantity,
          price: detail.price,
          createdOn: detail.createdOn,
          updatedOn: detail.updatedOn,
        }));
      },
    },
  });
}
