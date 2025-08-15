import * as coda from '@codahq/packs-sdk';

const API_VERSION = '1.0.0';
const RATE_LIMIT_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;

/**
 * Enhanced error handling for Webflow API responses
 */
export function getErrorMessage(status: number, body: any): string {
  const errorMessages: { [key: number]: string } = {
    400: 'Invalid request. Please check your input parameters.',
    401: 'Invalid access token. Please check your authentication settings.',
    403: 'Access token does not have required permissions. Please check your API token scopes.',
    404: 'Requested resource not found.',
    429: 'Rate limit reached. Please try again later.',
    500: 'Webflow API server error. Please try again later.',
    503: 'Webflow API service unavailable. Please try again later.',
  };

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
 * Fetch paginated data with retry logic
 */
export async function fetchPaginatedData(
  url: string,
  context: coda.ExecutionContext,
  includeDrafts = false,
  queryParams: Record<string, string> = {}
): Promise<any[]> {
  const allData: any[] = [];
  let currentUrl = url;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      // Append query parameters to URL
      const urlWithParams = new URL(currentUrl);
      Object.entries(queryParams).forEach(([key, value]) => {
        urlWithParams.searchParams.append(key, value);
      });

      const response = await context.fetcher.fetch({
        method: 'GET',
        url: urlWithParams.toString(),
        headers: {
          'Accept-Version': '1.0.0',
          ...(includeDrafts && { 'X-Draft': 'true' }),
        },
      });

      if (response.status !== 200) {
        throw new coda.UserVisibleError(
          getErrorMessage(response.status, response.body)
        );
      }

      allData.push(...response.body.items);

      if (response.body.pagination && response.body.pagination.nextUrl) {
        currentUrl = response.body.pagination.nextUrl;
      } else {
        hasNextPage = false;
      }

      // Respect rate limits
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
 * Fetch site details
 */
export async function fetchSiteDetails(
  siteId: string,
  context: coda.ExecutionContext
): Promise<any> {
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
 * Enhanced error handling with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: coda.FetchRequest,
  context: coda.ExecutionContext,
  retries = MAX_RETRIES
): Promise<any> {
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
    if (
      retries > 0 &&
      error instanceof Error &&
      'status' in error &&
      error.status === 429
    ) {
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
