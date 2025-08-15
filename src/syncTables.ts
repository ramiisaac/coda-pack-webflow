import * as coda from '@codahq/packs-sdk';
import { setupCards } from './cards';
import { setupCollections } from './collections';
import { setupColumns } from './columns';
import { setupDesignerElements } from './designerElements';
import { setupEcommerce } from './ecommerce';
import { setupForms } from './forms';
import { setupOrderDetails } from './orderDetails';
import { setupPages } from './pages';
import { setupSitemap } from './sitemap';
import { setupVariables } from './variables';
// import { setupDesignerExtensions } from './designerExtensions'; // Commented out due to API incompatibility

/**
 * Sync table definitions
 */
export function setupSyncTables(pack: coda.PackDefinitionBuilder) {
  setupSitemap(pack);
  setupDesignerElements(pack);
  setupColumns(pack);
  setupCards(pack);
  setupCollections(pack);
  setupForms(pack);
  setupEcommerce(pack);
  setupOrderDetails(pack);
  setupPages(pack);
  setupVariables(pack);
  // setupDesignerExtensions(pack); // Commented out due to API incompatibility

  // Add additional sync tables here
}
