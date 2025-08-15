import * as coda from '@codahq/packs-sdk';

interface Product {
  productName: string;
  price: number;
  sku: string;
  inventoryStatus: string;
}

/**
 * Custom Card for Displaying Webflow Products
 * Note: Custom Cards are deprecated in current SDK version
 */
export function setupCustomCards(pack: coda.PackDefinitionBuilder) {
  // Custom Cards functionality is deprecated, commenting out
  /*
  const ProductCardSchema = coda.makeObjectSchema({
    properties: {
      productName: { type: coda.ValueType.String, required: true },
      price: { type: coda.ValueType.Number, required: true },
      sku: { type: coda.ValueType.String, required: true },
      inventoryStatus: { type: coda.ValueType.String, required: true },
    },
    displayProperty: 'productName',
    idProperty: 'sku',
    featuredProperties: ['productName', 'price', 'sku', 'inventoryStatus'],
  });

  pack.addCard({
    name: 'ProductCard',
    description: 'Displays product information from Webflow Ecommerce.',
    image: 'https://example.com/product-card-image.png', // Replace with actual image URL
    schema: ProductCardSchema,
    getCardDisplay: async function (
      [product]: [Product],
      context: coda.ExecutionContext
    ) {
      return {
        title: product.productName,
        subtitle: `$${product.price.toFixed(2)}`,
        image: 'https://example.com/product-image.png', // Replace with dynamic image URL if available
        sections: [
          {
            widgets: [
              { type: coda.WidgetType.Text, text: `SKU: ${product.sku}` },
              {
                type: coda.WidgetType.Text,
                text: `Inventory: ${product.inventoryStatus}`,
              },
            ],
          },
        ],
      };
    },
  });
  */
}
