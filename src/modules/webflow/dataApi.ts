import { ApiClient } from '../../common/apiClient';
import { WEBFLOW_DATA_API } from '../../constants/paths';
import { Collection, Site } from '../../types/webflowTypes';

export class WebflowDataApi {
  private apiClient: ApiClient;
  private authToken: string;

  constructor(apiClient: ApiClient, authToken: string) {
    this.apiClient = apiClient;
    this.authToken = authToken;
  }

  // Fetch all sites
  async getSites(): Promise<Site[]> {
    const response = await this.apiClient.get<Site[]>(
      WEBFLOW_DATA_API.GET_SITES,
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Accept-Version': '1.0.0',
        },
      }
    );
    return response.body;
  }

  // Fetch a specific site by ID
  async getSite(siteId: string): Promise<Site> {
    const url = WEBFLOW_DATA_API.GET_SITE(siteId);
    const response = await this.apiClient.get<Site>(url, {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Accept-Version': '1.0.0',
      },
    });
    return response.body;
  }

  // Fetch collections for a specific site
  async getCollections(siteId: string): Promise<Collection[]> {
    const url = WEBFLOW_DATA_API.GET_COLLECTIONS(siteId);
    const response = await this.apiClient.get<Collection[]>(url, {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Accept-Version': '1.0.0',
      },
    });
    return response.body;
  }

  // Add more methods as needed for other API interactions
}

// ... existing code ...
