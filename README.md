# Webflow API

Webflow API is a Coda pack for reading Webflow sites, collections, pages, forms, ecommerce data, and related Webflow resources. It supports both direct formulas and sync tables for Webflow content workflows.

## Overview

- Purpose: Bring Webflow site and CMS data into Coda through formulas and sync tables.
- Inputs: Webflow site IDs, collection IDs, order IDs, and other endpoint-specific identifiers.
- Outputs: Webflow site objects, collection data, and synced rows for supported Webflow resources.
- Audience: Coda users working with Webflow sites, CMS content, forms, orders, and design metadata.

## Requirements

- Account(s): Webflow account with API access to the target resources.
- Credentials: OAuth2 connection to Webflow.
- External setup: The connected Webflow account must have access to the sites and resources referenced in formulas or sync tables.
- Limits: Webflow API limits, account permissions, and endpoint availability apply.

## Installation

1. Install the pack in a Coda doc.
2. Connect a Webflow account through OAuth2.
3. Start with `ListWebflowSites` to discover site IDs, then use direct formulas or add the relevant sync tables for the resources you need.

## Authentication

This pack uses OAuth2 against the Webflow API.

- Method: OAuth2.
- Required scopes or permissions: Site, CMS, and ecommerce scopes as requested by the pack.
- Where credentials are entered in Coda: In the pack account connection flow.

## Formulas

| Name                       | Type    | Description                                        | Inputs                                   | Returns                     |
| -------------------------- | ------- | -------------------------------------------------- | ---------------------------------------- | --------------------------- |
| `ListWebflowSites`         | Formula | Lists sites available to the connected account.    | None                                     | Array of site objects       |
| `GetWebflowSite`           | Formula | Retrieves one Webflow site by ID.                  | `siteId`                                 | Site object                 |
| `GetWebflowCollections`    | Formula | Lists collections for a site.                      | `siteId`                                 | Array of collection objects |
| `ListCards`                | Formula | Lists card resources for a site.                   | Site-specific parameters                 | Array of card objects       |
| `ListCollections`          | Formula | Lists collections for a site or context.           | Site-specific parameters                 | Array of collection objects |
| `GetCollectionItem`        | Formula | Retrieves one collection item.                     | `collectionId`, `itemId`                 | Collection item object      |
| `CreateCollectionItem`     | Action  | Creates a collection item.                         | `collectionId`, item fields              | API result                  |
| `UpdateCollectionItem`     | Action  | Updates a collection item.                         | `collectionId`, `itemId`, updated fields | API result                  |
| `DeleteCollectionItem`     | Action  | Deletes one collection item.                       | `collectionId`, `itemId`                 | API result                  |
| `DeleteAllCollectionItems` | Action  | Deletes all collection items in a collection.      | `collectionId`                           | API result                  |
| `ListVariables`            | Formula | Lists variables for a collection or related scope. | Collection-specific parameters           | Array of variable objects   |
| `CreateVariable`           | Action  | Creates a variable.                                | `collectionId`, `name`, `value`          | API result                  |
| `UpdateVariable`           | Action  | Updates a variable.                                | `collectionId`, `variableId`, `value`    | API result                  |

## Columns

| Name              | Type   | Description                                      | Source                  |
| ----------------- | ------ | ------------------------------------------------ | ----------------------- |
| Site fields       | Object | Site metadata returned by Webflow site endpoints | Webflow Sites API       |
| Collection fields | Object | Collection metadata and item fields              | Webflow CMS API         |
| Order fields      | Object | Ecommerce order metadata                         | Webflow ecommerce API   |
| Form fields       | Object | Webflow form metadata                            | Webflow forms endpoints |

## Tables

| Name               | Identity                          | Description                      | Key columns                    | Notes                  |
| ------------------ | --------------------------------- | -------------------------------- | ------------------------------ | ---------------------- |
| `Sitemap`          | Webflow sitemap row identity      | Syncs sitemap data for a site.   | URL and sitemap fields         | Site-scoped sync       |
| `DesignerElements` | Webflow designer element identity | Syncs designer element records.  | Element fields from the schema | Site-scoped sync       |
| `Columns`          | Webflow column identity           | Syncs collection columns.        | Collection column fields       | Collection-scoped sync |
| `StatusColumns`    | Webflow status column identity    | Syncs collection status columns. | Status-related fields          | Collection-scoped sync |
| `Forms`            | Webflow form identity             | Syncs site forms.                | Form metadata fields           | Site-scoped sync       |
| `Orders`           | Webflow order identity            | Syncs ecommerce orders.          | Order summary fields           | Site-scoped sync       |
| `OrderDetails`     | Webflow order detail identity     | Syncs detailed order rows.       | Order detail fields            | Order-scoped sync      |
| `Pages`            | Webflow page identity             | Syncs pages for a site.          | Page metadata fields           | Site-scoped sync       |

## Example usage

### Review Webflow site resources in Coda

1. Connect a Webflow account through OAuth.
2. Use `ListWebflowSites()` to find the right `siteId`.
3. Use `GetWebflowSite(siteId)` to verify site access.
4. Add one of the sync tables such as `Pages`, `Forms`, or `Orders` to bring Webflow data into a doc.

## Limitations

- The pack surface depends on Webflow API availability and account permissions.
- Some Webflow resource types are not exposed as sync tables in the current implementation.
- Returned object shapes vary by endpoint and are tied to the current Webflow API schema.

## Troubleshooting

| Problem                                     | Likely cause                                           | Resolution                                                             |
| ------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| OAuth connection succeeds but data is empty | Connected account lacks access to the site or resource | Reconnect with an account that can access the target Webflow resources |
| Sync table returns no rows                  | Wrong site, collection, or order identifier            | Verify the Webflow IDs used in the sync configuration                  |
| Endpoint request fails                      | Webflow API limit or schema mismatch                   | Retry later and verify the current Webflow API endpoint requirements   |

## Development notes

- Entry point: `src/pack.ts`
- Build: `pnpm run build`
- Lint: `pnpm run lint`
- Test: `pnpm run test`

## Repository

- Source: https://github.com/ramiisaac/coda_webflow
- Issue tracking: https://github.com/ramiisaac/coda_webflow/issues

## License

[MIT](LICENSE). Copyright (c) 2026 Rami Isaac.

## Author

Author: Rami Isaac <https://github.com/ramiisaac>

Last Edited: 2026-03-26
