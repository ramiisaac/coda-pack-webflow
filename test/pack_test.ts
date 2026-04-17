import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import sinon from 'sinon';
import { pack } from '../src/pack';
import {
  executeFormulaFromPackDef,
  executeSyncFormulaFromPackDef,
  newJsonFetchResponse,
  newMockExecutionContext,
  newMockSyncExecutionContext,
} from '@codahq/packs-sdk/dist/development';

describe('Webflow API Pack', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Pack Import', () => {
    it('should import the pack without errors', () => {
      expect(pack).to.be.an('object');
    });

    it('should have OAuth2 authentication configured', () => {
      expect(pack.defaultAuthentication).to.exist;
      expect(pack.defaultAuthentication!.type).to.equal('OAuth2');
    });

    it('should have api.webflow.com as a network domain', () => {
      expect(pack.networkDomains).to.include('api.webflow.com');
    });

    it('should have sync tables registered', () => {
      expect(pack.syncTables).to.be.an('array');
      expect(pack.syncTables.length).to.be.greaterThan(0);
    });

    it('should have formulas registered', () => {
      expect(pack.formulas).to.be.an('array').that.is.not.empty;
    });
  });

  describe('OAuth2 Connection Name', () => {
    it('should return site name when API returns sites', async () => {
      const context = newMockExecutionContext();
      (context.fetcher.fetch as any).resolves(
        newJsonFetchResponse([
          { name: 'My Webflow Site', id: 'site-123' },
          { name: 'Another Site', id: 'site-456' },
        ]),
      );

      const auth = pack.defaultAuthentication as any;
      const connectionName = await auth.getConnectionName.execute([], context);
      expect(connectionName).to.equal('My Webflow Site');
    });

    it('should return fallback name when API returns empty sites array', async () => {
      const context = newMockExecutionContext();
      (context.fetcher.fetch as any).resolves(newJsonFetchResponse([]));

      const auth = pack.defaultAuthentication as any;
      const connectionName = await auth.getConnectionName.execute([], context);
      expect(connectionName).to.equal('Webflow User');
    });

    it('should return fallback name when API call fails', async () => {
      const context = newMockExecutionContext();
      (context.fetcher.fetch as any).rejects(new Error('Network error'));

      const auth = pack.defaultAuthentication as any;
      const connectionName = await auth.getConnectionName.execute([], context);
      expect(connectionName).to.equal('Webflow User');
    });
  });

  describe('Formula behavior', () => {
    it('ListWebflowSites should fetch and return accessible sites', async () => {
      const context = newMockExecutionContext();
      context.fetcher.fetch.resolves(
        newJsonFetchResponse([
          {
            _id: 'site-123',
            name: 'Marketing Site',
            createdOn: '2025-01-01T00:00:00.000Z',
            lastPublishedOn: '2025-01-02T00:00:00.000Z',
          },
        ]),
      );

      const result = await executeFormulaFromPackDef(
        pack,
        'ListWebflowSites',
        [],
        context,
      );

      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.include({
        Id: 'site-123',
        Name: 'Marketing Site',
      });

      const fetchCall = context.fetcher.fetch.firstCall.args[0];
      expect(fetchCall.method).to.equal('GET');
      expect(fetchCall.url).to.equal('https://api.webflow.com/sites');
      expect(fetchCall.headers).to.deep.equal({
        'Accept-Version': '1.0.0',
      });
    });

    it('GetWebflowSite should fetch and return a site object', async () => {
      const context = newMockExecutionContext();
      context.fetcher.fetch.resolves(
        newJsonFetchResponse({
          _id: 'site-123',
          name: 'Marketing Site',
          createdOn: '2025-01-01T00:00:00.000Z',
          lastPublishedOn: '2025-01-02T00:00:00.000Z',
        }),
      );

      const result = await executeFormulaFromPackDef(
        pack,
        'GetWebflowSite',
        ['site-123'],
        context,
      );

      expect(result).to.include({
        Id: 'site-123',
        Name: 'Marketing Site',
      });

      const fetchCall = context.fetcher.fetch.firstCall.args[0];
      expect(fetchCall.method).to.equal('GET');
      expect(fetchCall.url).to.equal('https://api.webflow.com/sites/site-123');
      expect(fetchCall.headers).to.deep.equal({
        'Accept-Version': '1.0.0',
      });
    });

    it('GetWebflowCollections should return collection results from the API', async () => {
      const context = newMockExecutionContext();
      const delayStub = sinon.stub(global, 'setTimeout').callsFake(((fn: any) => {
        fn();
        return 0 as any;
      }) as any);

      context.fetcher.fetch.resolves(
        newJsonFetchResponse({
          items: [
            {
              _id: 'col-1',
              name: 'Blog Posts',
              slug: 'blog-posts',
            },
            {
              _id: 'col-2',
              name: 'Authors',
              slug: 'authors',
            },
          ],
          pagination: {},
        }),
      );

      const result = await executeFormulaFromPackDef(
        pack,
        'GetWebflowCollections',
        ['site-123'],
        context,
      );

      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.include({
        Id: 'col-1',
        Name: 'Blog Posts',
      });
      expect(delayStub.called).to.be.true;
    });

    it('CreateCollectionItem should POST and map the response', async () => {
      const context = newMockExecutionContext();
      context.fetcher.fetch.resolves(
        newJsonFetchResponse(
          {
            _id: 'item-123',
            name: 'Hello World',
            slug: 'hello-world',
            createdOn: '2025-01-01T00:00:00.000Z',
            updatedOn: '2025-01-02T00:00:00.000Z',
          },
          201,
        ),
      );

      const result = await executeFormulaFromPackDef(
        pack,
        'CreateCollectionItem',
        ['collection-123', 'Hello World', 'hello-world'],
        context,
      );

      expect(result).to.deep.equal({
        Id: 'item-123',
        Name: 'Hello World',
        Slug: 'hello-world',
        CreatedOn: '2025-01-01T00:00:00.000Z',
        UpdatedOn: '2025-01-02T00:00:00.000Z',
      });

      const fetchCall = context.fetcher.fetch.firstCall.args[0];
      expect(fetchCall.method).to.equal('POST');
      expect(fetchCall.url).to.equal(
        'https://api.webflow.com/v2/collections/collection-123/items',
      );
      expect(fetchCall.headers).to.deep.equal({
        'Content-Type': 'application/json',
        'Accept-Version': '1.0.0',
      });
      expect(fetchCall.body).to.equal(
        JSON.stringify({
          fields: {
            name: 'Hello World',
            slug: 'hello-world',
            _archived: false,
            _draft: false,
          },
        }),
      );
    });
  });

  describe('Sync table behavior', () => {
    it('Pages sync should map page rows', async () => {
      const context = newMockSyncExecutionContext();
      sinon.stub(global, 'setTimeout').callsFake(((fn: any) => {
        fn();
        return 0 as any;
      }) as any);

      context.fetcher.fetch.resolves(
        newJsonFetchResponse({
          items: [
            {
              _id: 'page-1',
              name: 'Home',
              slug: 'home',
              createdOn: '2025-01-01T00:00:00.000Z',
              updatedOn: '2025-01-02T00:00:00.000Z',
            },
          ],
          pagination: {},
        }),
      );

      const result = await executeSyncFormulaFromPackDef(
        pack,
        'Pages',
        ['site-123'],
        context,
      );

      expect(result).to.deep.equal([
        {
          Id: 'page-1',
          Name: 'Home',
          Slug: 'home',
          CreatedOn: '2025-01-01T00:00:00.000Z',
          UpdatedOn: '2025-01-02T00:00:00.000Z',
        },
      ]);
    });

    it('Forms sync should include submissions with default fallback', async () => {
      const context = newMockSyncExecutionContext();
      sinon.stub(global, 'setTimeout').callsFake(((fn: any) => {
        fn();
        return 0 as any;
      }) as any);

      context.fetcher.fetch.resolves(
        newJsonFetchResponse({
          items: [
            {
              _id: 'form-1',
              name: 'Contact Us',
              slug: 'contact-us',
              createdOn: '2025-01-01T00:00:00.000Z',
              updatedOn: '2025-01-03T00:00:00.000Z',
            },
          ],
          pagination: {},
        }),
      );

      const result = await executeSyncFormulaFromPackDef(
        pack,
        'Forms',
        ['site-123'],
        context,
      );

      expect(result).to.deep.equal([
        {
          Id: 'form-1',
          Name: 'Contact Us',
          Slug: 'contact-us',
          Submissions: 0,
          CreatedOn: '2025-01-01T00:00:00.000Z',
          UpdatedOn: '2025-01-03T00:00:00.000Z',
        },
      ]);
    });

    it('Orders sync should parse totals as numbers', async () => {
      const context = newMockSyncExecutionContext();
      sinon.stub(global, 'setTimeout').callsFake(((fn: any) => {
        fn();
        return 0 as any;
      }) as any);

      context.fetcher.fetch.resolves(
        newJsonFetchResponse({
          items: [
            {
              _id: 'order-1',
              email: 'buyer@example.com',
              total: '149.95',
              status: 'paid',
              createdOn: '2025-01-01T00:00:00.000Z',
              updatedOn: '2025-01-02T00:00:00.000Z',
            },
          ],
          pagination: {},
        }),
      );

      const result = await executeSyncFormulaFromPackDef(
        pack,
        'Orders',
        ['site-123'],
        context,
      );

      expect(result).to.deep.equal([
        {
          Id: 'order-1',
          Email: 'buyer@example.com',
          Total: 149.95,
          Status: 'paid',
          CreatedOn: '2025-01-01T00:00:00.000Z',
          UpdatedOn: '2025-01-02T00:00:00.000Z',
        },
      ]);
    });
  });
});
