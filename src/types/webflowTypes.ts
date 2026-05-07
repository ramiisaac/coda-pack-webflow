/**
 * TypeScript types describing the JSON shapes returned by the Webflow API.
 *
 * These interfaces capture the subset of fields actually consumed by this
 * pack. Webflow returns additional properties on most resources; unknown keys
 * are intentionally not modeled to keep this surface focused and truthful.
 */

/** Common timestamp fields returned by most Webflow resources. */
export interface WebflowTimestamps {
  createdOn?: string;
  updatedOn?: string;
}

/** Pagination envelope used by Webflow v2 list endpoints. */
export interface WebflowPagination {
  nextUrl?: string;
  limit?: number;
  offset?: number;
  total?: number;
}

/**
 * Generic shape of a paginated list response from the Webflow v2 API.
 * `T` is the element type contained in the `items` array.
 */
export interface WebflowPaginatedResponse<T> {
  items: T[];
  pagination?: WebflowPagination;
}

/** Webflow error response body. Either `msg` or `message` may be set. */
export interface WebflowErrorBody {
  msg?: string;
  message?: string;
  code?: string | number;
  err?: string;
}

export interface Site extends WebflowTimestamps {
  _id: string;
  name: string;
  lastPublishedOn?: string;
}

export interface Collection extends WebflowTimestamps {
  _id: string;
  name: string;
  slug?: string;
}

export interface CollectionItem extends WebflowTimestamps {
  _id: string;
  name: string;
  slug?: string;
}

/** A single option choice on a Webflow field with `type === 'Option'`. */
export interface CollectionFieldOption {
  name: string;
  id?: string;
}

/** Field/column definition on a Webflow CMS collection. */
export interface CollectionField extends WebflowTimestamps {
  id: string;
  slug?: string;
  displayName?: string;
  type?: string;
  order?: number;
  validations?: {
    options?: CollectionFieldOption[];
  };
}

export interface Page extends WebflowTimestamps {
  _id: string;
  name: string;
  slug?: string;
}

export interface Form extends WebflowTimestamps {
  _id: string;
  name: string;
  slug?: string;
  submissions?: number;
}

export interface DesignerElement extends WebflowTimestamps {
  _id: string;
  name: string;
  type?: string;
  text?: string;
}

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

/**
 * Webflow ecommerce order. Webflow returns `total` as a string in some
 * legacy responses and a number in others; callers should coerce.
 */
export interface Order extends WebflowTimestamps {
  _id: string;
  email: string;
  total: string | number;
  status: string;
}

export interface OrderLineItem extends WebflowTimestamps {
  productName: string;
  quantity: number;
  price: number;
}

export interface DesignVariable extends WebflowTimestamps {
  _id: string;
  name: string;
  value?: string;
}

/** Card resource returned from the `/sites/{siteId}/cards` endpoint. */
export interface Card {
  _id: string;
  name: string;
  type?: string;
  lastUpdated?: string;
}

/** Response shape for `GET /sites/{siteId}/cards`. */
export interface CardsResponse {
  cards: Card[];
}

/** JSON body accepted by Webflow CMS item create/update endpoints. */
export interface CollectionItemFields {
  name?: string;
  slug?: string;
  _archived?: boolean;
  _draft?: boolean;
  [customField: string]: string | number | boolean | null | undefined;
}

export interface CollectionItemRequestBody {
  fields: CollectionItemFields;
}
