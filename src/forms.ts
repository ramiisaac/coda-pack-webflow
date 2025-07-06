import * as coda from '@codahq/packs-sdk';
import { fetchPaginatedData } from './utils';

/**
 * Form-related formulas
 */
export function setupForms(pack: coda.PackBuilder) {
  const FormSchema = coda.makeObjectSchema({
    properties: {
      id: { type: coda.ValueType.String, required: true },
      name: { type: coda.ValueType.String, required: true },
      slug: { type: coda.ValueType.String },
      submissions: { type: coda.ValueType.Number },
      createdOn: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
        required: false,
      },
      updatedOn: {
        type: coda.ValueType.String,
        codaType: coda.ValueHintType.DateTime,
        required: false,
      },
    },
    displayProperty: 'name',
    idProperty: 'id',
    featuredProperties: ['name', 'slug', 'submissions'],
  });

  pack.addSyncTable({
    name: 'Forms',
    description: 'A table of all forms in your Webflow site.',
    identityName: 'Form',
    schema: FormSchema,
    connectionRequirement: coda.ConnectionRequirement.Required,
    formula: {
      name: 'SyncForms',
      description: 'Sync all forms from a Webflow site.',
      parameters: [
        coda.makeParameter({
          type: coda.ParameterType.String,
          name: 'siteId',
          description: 'The ID of the Webflow site.',
          example: '5c8f32c0d1a1c63cbc4bedf7',
        }),
      ],
      execute: async function (
        [siteId]: [string],
        context: coda.ExecutionContext
      ): Promise<any[]> {
        const url = `https://api.webflow.com/v2/sites/${siteId}/forms`;
        const forms = await fetchPaginatedData(url, context, true);

        return forms.map((form: any) => ({
          id: form._id,
          name: form.name,
          slug: form.slug,
          submissions: form.submissions || 0,
          createdOn: form.createdOn,
          updatedOn: form.updatedOn,
        }));
      },
    },
  });

  // Additional form-related formulas can be added here
}
