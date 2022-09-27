"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
class MemoryCache {
    constructor() {
        this.tld = new Map();
        this.slds = new Map();
    }
    getTld(tldHash) {
        return Promise.resolve(this.tld.get(tldHash));
    }
    getTlds() {
        return Promise.resolve(Array.from(this.tld.values()) || []);
    }
    getSld(tldHash, sldHash) {
        if (this.slds.has(tldHash)) {
            const sldCache = this.slds.get(tldHash);
            if (sldCache) {
                return Promise.resolve(sldCache.get(sldHash));
            }
        }
        return Promise.resolve(undefined);
    }
    setTld(tldHash, tld) {
        this.tld.set(tldHash, tld);
        return Promise.resolve();
    }
    setSld(tldHash, sld) {
        if (this.slds.has(tldHash)) {
            const sldDomainCache = this.slds.get(tldHash);
            if (!sldDomainCache.has(sld.nameHash.sldHash)) {
                sldDomainCache.set(sld.nameHash.sldHash, sld);
            }
        }
        else {
            this.slds.set(tldHash, new Map([[sld.nameHash.sldHash, sld]]));
        }
        return Promise.resolve();
    }
    hasTld(key) {
        return Promise.resolve(this.tld.has(key));
    }
    hasSld(tldHash, sldHash) {
        if (this.slds.has(tldHash)) {
            const sldCache = this.slds.get(tldHash);
            if (sldCache) {
                return Promise.resolve(sldCache.has(sldHash));
            }
        }
        return Promise.resolve(false);
    }
}
exports.MemoryCache = MemoryCache;
