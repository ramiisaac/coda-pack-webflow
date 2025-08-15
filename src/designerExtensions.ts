import * as coda from '@codahq/packs-sdk';
// import { WebflowClient } from 'webflow-api'; // Commented out due to API incompatibility

interface ExtensionContext extends coda.ExecutionContext {
  addCardInput?: {
    accessToken: string;
  };
}

/**
 * Setup Designer Extensions using Webflow's Designer API
 * Note: Designer Extensions are not supported in the current SDK version
 */
export function setupDesignerExtensions(pack: coda.PackDefinitionBuilder) {
  // Designer Extensions functionality commented out due to API deprecation
  /*
  pack.addExtension({
    name: 'InsertEmoji',
    description:
      'Inserts a text emoji into a selected element within the Webflow Designer.',
    permissions: ['designer.apps'],
    initialize: async function (context: ExtensionContext) {
      const accessToken = context.addCardInput?.accessToken;
      if (!accessToken) {
        throw new coda.UserVisibleError(
          'Access token is required to initialize the Designer Extension.'
        );
      }

      const client = new WebflowClient({ accessToken });

      return {
        insertEmoji: async function (
          elementId: string,
          emoji: string
        ): Promise<string> {
          try {
            // Fetch the current element details
            const element = await client.elements.get(elementId);
            if (!element) {
              throw new Error('Element not found.');
            }

            // Update the element's text by appending the emoji
            const updatedText = `${element.text || ''} ${emoji}`;
            await client.elements.update(elementId, { text: updatedText });

            return `Emoji "${emoji}" inserted successfully into element ${elementId}.`;
          } catch (error: any) {
            throw new coda.UserVisibleError(
              `Failed to insert emoji: ${error.message}`
            );
          }
        },
      };
    },
  });
  */

  // Additional Extensions can be added here following the above pattern
}
