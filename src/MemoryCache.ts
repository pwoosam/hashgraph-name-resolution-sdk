import { ICache } from "./types/Cache";
import { SecondLevelDomain } from "./types/SecondLevelDomain";
import { TopLevelDomain } from "./types/TopLevelDomain";

export class MemoryCache implements ICache {
  tld: Map<string, TopLevelDomain>;
  slds: Map<string, Map<string, SecondLevelDomain>>;

  constructor() {
    this.tld = new Map<string, TopLevelDomain>();
    this.slds = new Map<string, Map<string, SecondLevelDomain>>();
  }

  getTld(
    tldHash: string
  ):Promise<TopLevelDomain | undefined> {
    return Promise.resolve(this.tld.get(tldHash));
  }

  getTlds(): Promise<TopLevelDomain[]> {
    return Promise.resolve(Array.from(this.tld.values()) || []);
  }

  getSld(
    tldHash: string,
    sldHash: string
  ): Promise<SecondLevelDomain | undefined> {
    if (this.slds.has(tldHash)) {
      const sldCache = this.slds.get(tldHash);
      if (sldCache) {
        return Promise.resolve(sldCache.get(sldHash));
      }
    }
    return Promise.resolve(undefined);
  }

  setTld(tldHash: string, tld: TopLevelDomain): Promise<void> {
    this.tld.set(tldHash, tld);
    return Promise.resolve();
  }

  setSld(tldHash: string, sld: SecondLevelDomain): Promise<void> {
    if (this.slds.has(tldHash)) {
      const sldDomainCache = this.slds.get(tldHash)!;
      if (!sldDomainCache.has(sld.nameHash.sldHash)) {
        sldDomainCache.set(sld.nameHash.sldHash, sld);
      }
    } else {
      this.slds.set(tldHash, new Map([[sld.nameHash.sldHash, sld]]));
    }
    return Promise.resolve();
  }

  hasTld(key: string): Promise<boolean> {
    return Promise.resolve(this.tld.has(key));
  }

  hasSld(tldHash: string, sldHash: string): Promise<boolean> {
    if (this.slds.has(tldHash)) {
      const sldCache = this.slds.get(tldHash);
      if (sldCache) {
        return Promise.resolve(sldCache.has(sldHash));
      }
    }
    return Promise.resolve(false);
  }
}
