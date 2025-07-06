import { Fetcher, FetchRequest, FetchResponse } from '@codahq/packs-sdk';

export class ApiClient {
  private fetcher: Fetcher;

  constructor(fetcher: Fetcher) {
    this.fetcher = fetcher;
  }

  // Generic GET request
  async get<T>(url: string, params?: Record<string, any>): Promise<FetchResponse<T>> {
    const request: FetchRequest = {
      method: 'GET',
      url: this.constructUrl(url, params),
    };
    return this.fetcher.fetch<T>(request);
  }

  // Generic POST request
  async post<T>(url: string, body: any): Promise<FetchResponse<T>> {
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

  // Construct URL with query parameters
  private constructUrl(url: string, params?: Record<string, any>): string {
    if (!params) return url;
    const query = new URLSearchParams(params).toString();
    return `${url}?${query}`;
  }
} 