// Define TypeScript types for Webflow data

export interface Site {
  _id: string;
  name: string;
  createdOn: string;
  lastPublishedOn: string;
  // Add more fields as necessary
}

export interface Collection {
  _id: string;
  name: string;
  slug: string;
  createdOn: string;
  updatedOn: string;
  // Add more fields as necessary
}

// Add additional interfaces or types as needed