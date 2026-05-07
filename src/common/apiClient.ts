import { Fetcher, FetchRequest, FetchResponse } from '@codahq/packs-sdk';

/** Acceptable JSON value used for query params and request bodies. */
type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export class ApiClient {
  private fetcher: Fetcher;

  constructor(fetcher: Fetcher) {
    this.fetcher = fetcher;
  }

  async get<T>(
    url: string,
    params?: Record<string, string | number | boolean>
  ): Promise<FetchResponse<T>> {
    const request: FetchRequest = {
      method: 'GET',
      url: this.constructUrl(url, params),
    };
    return this.fetcher.fetch<T>(request);
  }

  async post<T>(url: string, body: JsonValue): Promise<FetchResponse<T>> {
    const request: FetchRequest = {
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };
    return this.fetcher.fetch<T>(request);
  }

  private constructUrl(
    url: string,
    params?: Record<string, string | number | boolean>
  ): string {
    if (!params) return url;
    const stringified: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      stringified[key] = String(value);
    }
    const query = new URLSearchParams(stringified).toString();
    return `${url}?${query}`;
  }
}
