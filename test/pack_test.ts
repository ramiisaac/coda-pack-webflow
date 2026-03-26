import { expect } from 'chai';
import { describe, it } from 'mocha';
import { pack } from '../src/pack';
import {
  newMockExecutionContext,
  newJsonFetchResponse,
} from '@codahq/packs-sdk/dist/development';

describe('Webflow API Pack', () => {
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
      expect(pack.formulas).to.be.an('array');
    });
  });

  describe('OAuth2 Connection Name', () => {
    it('should return site name when API returns sites', async () => {
      const context = newMockExecutionContext();
      const mockSites = [
        { name: 'My Webflow Site', id: 'site-123' },
        { name: 'Another Site', id: 'site-456' },
      ];
      (context.fetcher.fetch as any).resolves(newJsonFetchResponse(mockSites));

      const auth = pack.defaultAuthentication as any;
      expect(auth).to.exist;
      expect(auth.getConnectionName).to.exist;
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
});
