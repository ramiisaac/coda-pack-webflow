import * as coda from '@codahq/packs-sdk';
import { ConnectionRequirement } from '@codahq/packs-sdk';

export const pack = coda.newPack();

pack.addNetworkDomain('api.webflow.com');

pack.setUserAuthentication({
  type: coda.AuthenticationType.HeaderBearerToken,
  instructionsUrl:
    'https://university.webflow.com/lesson/intro-to-the-webflow-api',
});

const BASE_URL = 'https://api.webflow.com/v2';

const PageSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, required: true },
    name: { type: coda.ValueType.String, required: true },
    title: { type: coda.ValueType.String },
    slug: { type: coda.ValueType.String },
    url: { type: coda.ValueType.String },
    createdOn: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
    },
    lastUpdated: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
    },
  },
  displayProperty: 'name',
  idProperty: 'id',
  featuredProperties: ['name', 'slug', 'url'],
});

// Add API version constant
const API_VERSION = '1.0.0';

// Add rate limit handling constants
const RATE_LIMIT_DELAY = 1000; // 1 second delay when rate limited
const MAX_RETRIES = 3;

/**
 * Enhanced error handling for Webflow API responses
 */
function getErrorMessage(status: number, body: any): string {
  const errorMessages = {
    400: 'Invalid request. Please check your input parameters.',
    401: 'Invalid access token. Please check your authentication settings.',
    403: 'Access token does not have required permissions. Please check your API token scopes.',
    404: 'Requested resource not found.',
    429: 'Rate limit reached. Please try again later.',
    500: 'Webflow API server error. Please try again later.',
    503: 'Webflow API service unavailable. Please try again later.',
  };

  // Handle structured error responses from Webflow
  if (body && typeof body === 'object') {
    if (body.msg || body.message) {
      return `Error: ${body.msg || body.message}`;
    }
  }

  return (
    errorMessages[status] ||
    `Unexpected error (${status}): ${JSON.stringify(body)}`
  );
}

/**
 * Enhanced paginated data fetching with retry logic
 */
async function fetchPaginatedData(
  url: string,
  context: coda.ExecutionContext,
  isCollection = false,
  queryParams = {}
) {
  const allData = [];
  let offset = 0;
  const limit = 100;
  let retryCount = 0;

  for (;;) {
    try {
      const response = await context.fetcher.fetch({
        method: 'GET',
        url: coda.withQueryParams(url, { limit, offset, ...queryParams }),
        headers: {
          Accept: 'application/json',
          'Accept-Version': API_VERSION,
        },
      });

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (retryCount >= MAX_RETRIES) {
          throw new coda.UserVisibleError(
            'Rate limit exceeded. Please try again later.'
          );
        }
        const delay = RATE_LIMIT_DELAY * Math.pow(2, retryCount);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
        retryCount++;
        continue;
      }

      if (response.status !== 200) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      const data = response.body;
      const items = isCollection ? data.collections : data.pages || data.items;

      if (!Array.isArray(items)) {
        throw new coda.UserVisibleError(
          'Unexpected response format from Webflow API'
        );
      }

      allData.push(...items);

      // Check if we've reached the end of pagination
      if (
        items.length < limit ||
        !data.pagination ||
        offset + limit >= data.pagination.total
      ) {
        break;
      }

      offset += limit;
      retryCount = 0; // Reset retry counter on successful request
    } catch (error) {
      if (error instanceof coda.UserVisibleError) {
        throw error;
      }
      throw new coda.UserVisibleError(`Failed to fetch data: ${error.message}`);
    }
  }

  return allData;
}

/**
 * Fetches site details from the Webflow API
 * @param {string} siteId - The ID of the site
 * @param {object} context - The execution context
 * @returns {Promise<object>} - The site details
 */
async function fetchSiteDetails(
  siteId: string,
  context: coda.ExecutionContext
) {
  const url = `${BASE_URL}/sites/${siteId}`;

  try {
    const response = await context.fetcher.fetch({
      method: 'GET',
      url: url,
      headers: {
        Accept: 'application/json',
        'Accept-Version': API_VERSION,
      },
    });

    if (response.status !== 200) {
      throw new coda.UserVisibleError(
        getErrorMessage(response.status, response.body)
      );
    }

    return response.body;
  } catch (error) {
    if (error instanceof coda.UserVisibleError) {
      throw error;
    }
    throw new coda.UserVisibleError(
      `Failed to fetch site details: ${error.message}`
    );
  }
}

pack.addFormula({
  name: 'ListPages',
  description: 'List all Webflow pages for a site.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'siteId',
      description: 'The ID of the site to list pages for.',
      example: '5c8f32c0d1a1c63cbc4bedf7',
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'locale',
      description: 'Unique identifier for a specific locale.',
      optional: true,
      example: 'en-US',
    }),
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: 'fields',
      description:
        'Specific fields to return. If empty, all fields are returned.',
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'sortBy',
      description: "Field to sort by. Default is 'title'.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: 'descending',
      description: 'Sort in descending order. Default is false.',
      optional: true,
    }),
  ],
  resultType: coda.ValueType.Array,
  items: PageSchema,
  execute: async function (
    [siteId, locale, fields, sortBy, descending],
    context
  ) {
    const url = `${BASE_URL}/sites/${siteId}/pages`;
    let pages = await fetchPaginatedData(url, context, false, { locale });

    pages = pages.map((page) => {
      const result = {} as any;
      (
        fields || ['id', 'title', 'slug', 'url', 'createdOn', 'lastUpdated']
      ).forEach((field) => {
        if (page[field]) result[field] = page[field];
      });
      if (result.title && !result.name) result.name = result.title;
      return result;
    });

    if (sortBy) {
      pages.sort((a, b) => {
        const comparison = String(a[sortBy]).localeCompare(String(b[sortBy]));
        return descending ? -comparison : comparison;
      });
    }

    return pages;
  },
});

pack.addFormula({
  name: 'GetPageMetadata',
  description: 'Get metadata for a specific Webflow page.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'pageId',
      description: 'The ID of the page to retrieve metadata for.',
      example: '5c8f32c0d1a1c63cbc4bedf8',
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'locale',
      description: 'Unique identifier for a specific locale.',
      optional: true,
      example: 'en-US',
    }),
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: 'fields',
      description:
        'Specific fields to return. If empty, all fields are returned.',
      optional: true,
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: PageSchema,
  execute: async function ([pageId, locale, fields], context) {
    const url = coda.withQueryParams(`${BASE_URL}/pages/${pageId}`, { locale });

    const response = await context.fetcher.fetch({
      method: 'GET',
      url: url,
      headers: { 'Accept-Version': '1.0.0' },
    });

    if (response.status !== 200)
      throw new coda.UserVisibleError(
        getErrorMessage(response.status, response.body)
      );

    const page = response.body;
    const result = {} as any;
    (fields || Object.keys(PageSchema.properties)).forEach((field) => {
      if (page[field]) result[field] = page[field];
    });
    return result;
  },
});

pack.addFormula({
  name: 'GetPageContent',
  description: 'Get static content from a Webflow page.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'pageId',
      description: 'Unique identifier for a Page.',
      example: '658205daa3e8206a523b5ad4',
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'locale',
      description: 'Unique identifier for a specific locale. Optional.',
      optional: true,
      example: 'en-US',
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'limit',
      description:
        'Maximum number of records to be returned (max 100). Optional.',
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Number,
      name: 'offset',
      description: 'Offset used for pagination. Optional.',
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'outputFormat',
      description:
        "Format of the output: 'full', 'text', or 'html'. Default is 'full'.",
      optional: true,
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: coda.makeObjectSchema({
    properties: {
      pageId: { type: coda.ValueType.String },
      nodes: coda.makeSchema({
        type: coda.ValueType.Array,
        items: coda.makeObjectSchema({
          properties: {
            id: { type: coda.ValueType.String },
            type: { type: coda.ValueType.String },
            text: coda.makeObjectSchema({
              properties: {
                html: { type: coda.ValueType.String },
                text: { type: coda.ValueType.String },
              },
            }),
            image: coda.makeObjectSchema({
              properties: {
                alt: { type: coda.ValueType.String },
                assetId: { type: coda.ValueType.String },
              },
            }),
            attributes: coda.makeObjectSchema({
              properties: {},
              allowAdditionalProperties: true,
            }),
          },
        }),
      }),
      pagination: coda.makeObjectSchema({
        properties: {
          limit: { type: coda.ValueType.Number },
          offset: { type: coda.ValueType.Number },
          total: { type: coda.ValueType.Number },
        },
      }),
    },
    required: ['pageId', 'nodes', 'pagination'],
  }),
  execute: async function (
    [pageId, locale, limit, offset, outputFormat],
    context
  ) {
    const headers = { Accept: 'application/json', 'Accept-Version': '1.0.0' };
    const queryParams = { locale, limit, offset };
    const url = coda.withQueryParams(
      `${BASE_URL}/pages/${pageId}/dom`,
      queryParams
    );

    const response = await context.fetcher.fetch({
      method: 'GET',
      url: url,
      headers: headers,
    });

    if (response.status !== 200)
      throw new coda.UserVisibleError(
        getErrorMessage(response.status, response.body)
      );

    const result = response.body;

    if (outputFormat) {
      const format = outputFormat.toLowerCase();
      if (format === 'text' || format === 'html') {
        result.nodes = result.nodes
          .map((node) => (node.text ? node.text[format] : ''))
          .filter(Boolean);
      }
    }

    return result;
  },
});

pack.addFormula({
  name: 'GetPageFullPath',
  description: 'Get the full path for a specific Webflow page.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'pageId',
      description: 'The ID of the page to get the full path for.',
      example: '65e76b264751d9251e634bcf',
    }),
  ],
  resultType: coda.ValueType.String,
  execute: async function ([pageId], context) {
    const url = `${BASE_URL}/pages/${pageId}`;
    const response = await context.fetcher.fetch({
      method: 'GET',
      url: url,
      headers: { Accept: 'application/json', 'Accept-Version': '1.0.0' },
    });

    if (response.status !== 200)
      throw new coda.UserVisibleError(
        getErrorMessage(response.status, response.body)
      );

    const pageData = response.body;
    if (!pageData.publishedPath)
      throw new coda.UserVisibleError(
        'Published path not found for this page.'
      );

    return `https://${pageData.domain}${pageData.publishedPath}`;
  },
});

const SitemapEntrySchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, required: true },
    name: { type: coda.ValueType.String, required: true },
    slug: { type: coda.ValueType.String, required: true },
    fullUrl: { type: coda.ValueType.String, required: true },
    parentId: { type: coda.ValueType.String },
    depth: { type: coda.ValueType.Number },
    isCollection: { type: coda.ValueType.Boolean },
    collectionId: { type: coda.ValueType.String },
    order: { type: coda.ValueType.Number },
  },
  displayProperty: 'name',
  idProperty: 'id',
  featuredProperties: ['name', 'fullUrl', 'isCollection', 'order'],
});

pack.addSyncTable({
  name: 'Sitemap',
  description:
    'A hierarchical table of all pages and collections from your Webflow site.',
  identityName: 'SitemapEntry',
  schema: SitemapEntrySchema,
  connectionRequirement: ConnectionRequirement.Required,
  formula: {
    name: 'SyncSitemap',
    description:
      'Sync all pages and collections from a Webflow site into a hierarchical sitemap structure.',
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: 'siteId',
        description: 'The ID of the Webflow site to fetch pages from.',
      }),
    ],
    execute: async function ([siteId], context) {
      // Fetch site details to get the domain name
      const siteDetails = await fetchSiteDetails(siteId, context);
      const domain =
        siteDetails.customDomains.length > 0
          ? siteDetails.customDomains[0]
          : `${siteDetails.shortName}.webflow.io`;

      // Fetch all site pages
      const sitePages = await fetchPaginatedData(
        `${BASE_URL}/sites/${siteId}/pages`,
        context,
        false
      );

      // Fetch all collections
      const collections = await fetchPaginatedData(
        `${BASE_URL}/sites/${siteId}/collections`,
        context,
        true
      );

      // Combine pages with collections
      const allItems = [
        ...sitePages.map((page) => ({
          ...page,
          type: 'page',
          isCollection: false,
        })),
        ...collections.map((collection) => ({
          ...collection,
          type: 'collection',
          isCollection: true,
        })),
      ];

      // Build hierarchy
      const itemMap = new Map<string, any>();
      allItems.forEach((item) => itemMap.set(item.id, item));

      // Function to build the full path
      function buildFullPath(item) {
        const pathParts = [];
        let currentItem = item;
        while (currentItem) {
          pathParts.unshift(currentItem.slug);
          if (!currentItem.parentId) break;
          currentItem = itemMap.get(currentItem.parentId);
          if (!currentItem) {
            console.log(`Parent not found for item: ${JSON.stringify(item)}`);
            break;
          }
        }
        return '/' + pathParts.join('/');
      }

      // Define the SitemapEntry interface to include the 'order' property
      interface SitemapEntry {
        id: string;
        name: string;
        slug: string;
        fullUrl: string;
        parentId?: string;
        depth: number;
        isCollection: boolean;
        collectionId?: string;
        order: number;
      }

      // Annotate processedItems with the SitemapEntry type
      const processedItems: SitemapEntry[] = allItems.map((item) => {
        const name = item.displayName || item.name || 'Unnamed';
        const fullPath = buildFullPath(item);

        console.log(
          `Processing item: ${name}, Path: ${fullPath}, ParentID: ${item.parentId}`
        );

        return {
          id: item.id,
          name: name,
          slug: item.slug || '',
          fullUrl: `https://${domain}${fullPath}`,
          parentId: item.parentId || '',
          depth: 0, // We'll calculate this later
          isCollection: item.isCollection,
          collectionId: item.collectionId || '',
          order: 0, // Initialize order; will be set later
        };
      });

      // Calculate depths
      function calculateDepth(item) {
        if (item.depth !== undefined) return item.depth;
        if (!item.parentId) {
          item.depth = 0;
        } else {
          const parent = processedItems.find(
            (p: SitemapEntry) => p.id === item.parentId
          );
          if (parent) {
            item.depth = calculateDepth(parent) + 1;
          } else {
            console.log(
              `Parent not found for depth calculation: ${JSON.stringify(item)}`
            );
            item.depth = 0;
          }
        }
        return item.depth;
      }

      processedItems.forEach((item) => calculateDepth(item));

      // Sort items to ensure parents come before children
      processedItems.sort((a, b) => a.depth - b.depth);

      // Assign order within each level
      const orderMap = new Map<string, SitemapEntry[]>();
      processedItems.forEach((item) => {
        const parentId = item.parentId || 'root';
        const siblings = orderMap.get(parentId) || [];
        item.order = siblings.length;
        siblings.push(item);
        orderMap.set(parentId, siblings);
      });

      console.log(`Total processed items: ${processedItems.length}`);

      return { result: processedItems };
    },
  },
});

// CMS API Integration
const CollectionSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, required: true },
    name: { type: coda.ValueType.String, required: true },
    slug: { type: coda.ValueType.String },
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
  execute: async function ([siteId], context) {
    const url = `${BASE_URL}/sites/${siteId}/collections`;
    const collections = await fetchPaginatedData(url, context, true);

    return collections.map((collection: any) => ({
      id: collection._id,
      name: collection.name,
      slug: collection.slug,
      createdOn: collection.createdOn,
      updatedOn: collection.updatedOn,
    }));
  },
});

// Add more CMS-related formulas (Create, Update, Delete Collection Items)
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
  schema: PageSchema,
  execute: async function ([collectionId, name, slug], context) {
    const url = `${BASE_URL}/collections/${collectionId}/items`;
    const response = await context.fetcher.fetch({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': API_VERSION,
      },
      body: {
        fields: {
          name: name,
          slug: slug,
          _archived: false,
          _draft: false,
        },
      },
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
  schema: PageSchema,
  execute: async function ([collectionId, itemId, name, slug], context) {
    const url = `${BASE_URL}/collections/${collectionId}/items/${itemId}`;
    const response = await context.fetcher.fetch({
      method: 'PATCH',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': API_VERSION,
      },
      body: {
        fields: {
          name: name,
          slug: slug,
        },
      },
    });

    if (response.status !== 200) {
      throw new coda.UserVisibleError(
        getErrorMessage(response.status, response.body)
      );
    }

    return response.body;
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
  execute: async function ([collectionId, itemId], context) {
    const url = `${BASE_URL}/collections/${collectionId}/items/${itemId}`;
    const response = await context.fetcher.fetch({
      method: 'DELETE',
      url: url,
      headers: {
        'Accept-Version': API_VERSION,
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

// Form Submissions Integration
const FormSubmissionSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, required: true },
    formId: { type: coda.ValueType.String, required: true },
    createdOn: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
    },
    data: coda.makeObjectSchema({
      properties: {
        email: { type: coda.ValueType.String },
        name: { type: coda.ValueType.String },
        message: { type: coda.ValueType.String },
        // Add other form field properties as needed
      },
    }),
  },
  displayProperty: 'id',
  idProperty: 'id',
  featuredProperties: ['formId', 'createdOn'],
});

pack.addFormula({
  name: 'ListFormSubmissions',
  description: 'List all submissions for a specific Webflow form.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'formId',
      description: 'The ID of the form to list submissions for.',
      example: '605d1b4f5d3c3a74b0d6e123',
    }),
  ],
  resultType: coda.ValueType.Array,
  items: FormSubmissionSchema,
  execute: async function ([formId], context) {
    const url = `${BASE_URL}/forms/${formId}/submissions`;
    const submissions = await fetchPaginatedData(url, context);

    return submissions.map((submission: any) => ({
      id: submission._id,
      formId: submission.formId,
      createdOn: submission.createdOn,
      data: {
        email: submission.data.email,
        name: submission.data.name,
        message: submission.data.message,
        // Map other fields as needed
      },
    }));
  },
});

// Ecommerce Integration
const ProductSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, required: true },
    name: { type: coda.ValueType.String, required: true },
    slug: { type: coda.ValueType.String },
    price: { type: coda.ValueType.Number },
    sku: { type: coda.ValueType.String },
    inventory: { type: coda.ValueType.Number },
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
  featuredProperties: ['name', 'sku', 'price'],
});

pack.addFormula({
  name: 'ListProducts',
  description: 'List all products in a Webflow Ecommerce store.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'collectionId',
      description: 'The ID of the Ecommerce collection.',
      example: '605d1b4f5d3c3a74b0d6e123',
    }),
  ],
  resultType: coda.ValueType.Array,
  items: ProductSchema,
  execute: async function ([collectionId], context) {
    const url = `${BASE_URL}/collections/${collectionId}/products`;
    const products = await fetchPaginatedData(url, context);

    return products.map((product: any) => ({
      id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sku: product.sku,
      inventory: product.inventory,
      createdOn: product.createdOn,
      updatedOn: product.updatedOn,
    }));
  },
});

const OrderSchema = coda.makeObjectSchema({
  properties: {
    id: { type: coda.ValueType.String, required: true },
    email: { type: coda.ValueType.String, required: true },
    total: { type: coda.ValueType.Number },
    status: { type: coda.ValueType.String },
    createdOn: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
    },
    updatedOn: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
    },
  },
  displayProperty: 'id',
  idProperty: 'id',
  featuredProperties: ['email', 'total', 'status'],
});

pack.addFormula({
  name: 'ListOrders',
  description: 'List all orders in a Webflow Ecommerce store.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'collectionId',
      description: 'The ID of the Ecommerce collection.',
      example: '605d1b4f5d3c3a74b0d6e123',
    }),
  ],
  resultType: coda.ValueType.Array,
  items: OrderSchema,
  execute: async function ([collectionId], context) {
    const url = `${BASE_URL}/collections/${collectionId}/orders`;
    const orders = await fetchPaginatedData(url, context);

    return orders.map((order: any) => ({
      id: order._id,
      email: order.email,
      total: order.total,
      status: order.status,
      createdOn: order.createdOn,
      updatedOn: order.updatedOn,
    }));
  },
});

// Variables API Integration
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
  execute: async function ([collectionId], context) {
    const url = `${BASE_URL}/collections/${collectionId}/items`;
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
  execute: async function ([collectionId, name, value], context) {
    const url = `${BASE_URL}/collections/${collectionId}/items`;
    const response = await context.fetcher.fetch({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': API_VERSION,
      },
      body: {
        fields: {
          name: name,
          value: value,
          _archived: false,
          _draft: false,
        },
      },
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
  execute: async function ([collectionId, variableId, value], context) {
    const url = `${BASE_URL}/collections/${collectionId}/items/${variableId}`;
    const response = await context.fetcher.fetch({
      method: 'PATCH',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': API_VERSION,
      },
      body: {
        fields: {
          value: value,
        },
      },
    });

    if (response.status !== 200) {
      throw new coda.UserVisibleError(
        getErrorMessage(response.status, response.body)
      );
    }

    return response.body;
  },
});

// Ecommerce Orders Management
const OrderDetailSchema = coda.makeObjectSchema({
  properties: {
    orderId: { type: coda.ValueType.String, required: true },
    customerEmail: { type: coda.ValueType.String, required: true },
    totalAmount: { type: coda.ValueType.Number },
    status: { type: coda.ValueType.String },
    products: coda.makeSchema({
      type: coda.ValueType.Array,
      items: coda.makeObjectSchema({
        properties: {
          productId: { type: coda.ValueType.String },
          name: { type: coda.ValueType.String },
          quantity: { type: coda.ValueType.Number },
          price: { type: coda.ValueType.Number },
        },
      }),
    }),
    createdOn: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
    },
    updatedOn: {
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.DateTime,
    },
  },
  displayProperty: 'orderId',
  idProperty: 'orderId',
  featuredProperties: ['customerEmail', 'totalAmount', 'status'],
});

pack.addFormula({
  name: 'ListOrderDetails',
  description: 'List detailed information for all orders.',
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: 'collectionId',
      description: 'The ID of the Ecommerce collection.',
      example: '605d1b4f5d3c3a74b0d6e123',
    }),
  ],
  resultType: coda.ValueType.Array,
  items: OrderDetailSchema,
  execute: async function ([collectionId], context) {
    const url = `${BASE_URL}/collections/${collectionId}/orders`;
    const orders = await fetchPaginatedData(url, context);

    return orders.map((order: any) => ({
      orderId: order._id,
      customerEmail: order.email,
      totalAmount: order.total,
      status: order.status,
      products: order.lineItems.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      createdOn: order.createdOn,
      updatedOn: order.updatedOn,
    }));
  },
});
