import * as coda from '@codahq/packs-sdk';
import {
  WebflowErrorBody,
  WebflowPaginatedResponse,
} from './types/webflowTypes';

const API_VERSION = '1.0.0';
const RATE_LIMIT_DELAY = 1000;
const MAX_RETRIES = 3;

function isWebflowErrorBody(value: unknown): value is WebflowErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('msg' in value || 'message' in value)
  );
}

/**
 * Assert that a successful fetcher response actually carries a parsed body.
 * The Coda SDK types `FetchResponse.body` as optional because non-JSON or
 * empty-body responses may omit it; for the JSON endpoints we call here, a
 * 2xx status without a body indicates a transport-level fault.
 */
export function requireBody<T>(body: T | undefined, context: string): T {
  if (body === undefined) {
    throw new coda.UserVisibleError(
      `Webflow API returned an empty response body (${context}).`
    );
  }
  return body;
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }
  return undefined;
}

/**
 * Translate a Webflow API HTTP status + body into a user-visible message.
 * `body` is `unknown` because the fetcher returns parsed JSON of arbitrary
 * shape; we narrow it before reading fields.
 */
export function getErrorMessage(status: number, body: unknown): string {
  const errorMessages: { [key: number]: string } = {
    400: 'Invalid request. Please check your input parameters.',
    401: 'Invalid access token. Please check your authentication settings.',
    403: 'Access token does not have required permissions. Please check your API token scopes.',
    404: 'Requested resource not found.',
    429: 'Rate limit reached. Please try again later.',
    500: 'Webflow API server error. Please try again later.',
    503: 'Webflow API service unavailable. Please try again later.',
  };

  if (isWebflowErrorBody(body)) {
    const msg = body.msg ?? body.message;
    if (msg) {
      return `Error: ${msg}`;
    }
  }

  return (
    errorMessages[status] ||
    `Unexpected error (${status}): ${JSON.stringify(body)}`
  );
}

/**
 * Walk every page of a Webflow v2 paginated list endpoint and return the
 * concatenated `items` array. The element type `T` is supplied by the caller
 * so downstream code receives correctly-typed records.
 */
export async function fetchPaginatedData<T = unknown>(
  url: string,
  context: coda.ExecutionContext,
  includeDrafts = false,
  queryParams: Record<string, string> = {}
): Promise<T[]> {
  const allData: T[] = [];
  let currentUrl = url;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const urlWithParams = new URL(currentUrl);
      Object.entries(queryParams).forEach(([key, value]) => {
        urlWithParams.searchParams.append(key, value);
      });

      const response = await context.fetcher.fetch<WebflowPaginatedResponse<T>>(
        {
          method: 'GET',
          url: urlWithParams.toString(),
          headers: {
            'Accept-Version': '1.0.0',
            ...(includeDrafts && { 'X-Draft': 'true' }),
          },
        }
      );

      if (response.status !== 200) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      const body = requireBody(response.body, 'fetchPaginatedData');
      allData.push(...body.items);

      if (body.pagination && body.pagination.nextUrl) {
        currentUrl = body.pagination.nextUrl;
      } else {
        hasNextPage = false;
      }

      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
    } catch (error) {
      if (error instanceof coda.UserVisibleError) {
        throw error;
      } else {
        throw new coda.UserVisibleError(
          'Failed to fetch data from Webflow API.'
        );
      }
    }
  }

  return allData;
}

/**
 * Fetch site details. The returned shape varies across Webflow API versions;
 * callers narrow the result themselves, so the body is returned as `unknown`.
 */
export async function fetchSiteDetails(
  siteId: string,
  context: coda.ExecutionContext
): Promise<unknown> {
  const url = `https://api.webflow.com/v2/sites/${siteId}`;
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
      `Failed to fetch site details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch a single resource with retry on 429 responses. Returns the parsed
 * response body as `unknown`; callers narrow to the expected resource type.
 */
export async function fetchWithRetry(
  url: string,
  options: coda.FetchRequest,
  context: coda.ExecutionContext,
  retries = MAX_RETRIES
): Promise<unknown> {
  try {
    const response = await context.fetcher.fetch({
      method: options.method || 'GET',
      url: url,
      headers: options.headers || {},
      body: options.body,
    });

    if (response.status !== 200) {
      if (response.status === 429 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
        return fetchWithRetry(url, options, context, retries - 1);
      }
      throw new coda.UserVisibleError(
        getErrorMessage(response.status, response.body)
      );
    }

    return response.body;
  } catch (error) {
    if (retries > 0 && getErrorStatus(error) === 429) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      return fetchWithRetry(url, options, context, retries - 1);
    }
    if (error instanceof coda.UserVisibleError) {
      throw error;
    }
    throw new coda.UserVisibleError(
      `Failed to fetch data from Webflow API: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
