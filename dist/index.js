"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = exports.MAIN_TLD_TOPIC_ID = exports.TEST_TLD_TOPIC_ID = void 0;
const domainCache_1 = require("./domainCache");
const hashDomain_1 = require("./hashDomain");
const mirrorNode_1 = require("./mirrorNode");
const pollingTopicSubscriber_1 = require("./topicSubscriber/pollingTopicSubscriber");
exports.TEST_TLD_TOPIC_ID = '0.0.48097305';
exports.MAIN_TLD_TOPIC_ID = '0.0.1234189';
class Resolver {
    constructor(networkType, authKey = '') {
        this._isCaughtUpWithTopic = new Map();
        this._subscriptions = [];
        this.mirrorNode = new mirrorNode_1.MirrorNode(networkType, authKey);
    }
    /**
     * @description Initializes all topic subscriptions.
     */
    init() {
        this.getTopLevelDomains().then(() => {
            const knownTlds = Array.from(domainCache_1.domainCache.tld.values());
            knownTlds.forEach(tld => {
                this.getSecondLevelDomains(tld.topicId);
            });
        });
    }
    async dispose() {
        await Promise.all(this._subscriptions.map(unsub => unsub()));
    }
    /**
     * @description Resolves a Second Level Domain to the wallet address of the domain's owner
     * @param domain: {string} The domain to query
     * @returns {Promise<AccountId>}
     */
    async resolveSLD(domain) {
        const nameHash = (0, hashDomain_1.hashDomain)(domain);
        const sld = await this.getSecondLevelDomain(nameHash);
        const [tokenId, serial] = sld.nftId.split(':');
        const nft = await this.mirrorNode.getNFT(tokenId, serial);
        return nft.account_id;
    }
    // Private
    getTldTopicId() {
        if (this.mirrorNode.networkType.includes("test"))
            return exports.TEST_TLD_TOPIC_ID;
        return exports.MAIN_TLD_TOPIC_ID;
    }
    /**
     * @description Retrieves and stores top level domains
     */
    async getTopLevelDomains() {
        await new Promise(resolve => {
            this._subscriptions.push(pollingTopicSubscriber_1.PollingTopicSubscriber.subscribe(this.mirrorNode.networkType, this.getTldTopicId(), messageObj => {
                const decoded = Buffer.from(messageObj.message, 'base64').toString();
                const tld = JSON.parse(decoded);
                // always set the cache to the latest tld on the topic
                domainCache_1.domainCache.tld.set(tld.nameHash.tldHash, tld);
            }, () => {
                this._isCaughtUpWithTopic.set(this.getTldTopicId(), true);
                resolve();
            }, undefined, this.mirrorNode.authKey));
        });
    }
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    async getTopLevelDomain(nameHash) {
        while (!this._isCaughtUpWithTopic.get(this.getTldTopicId())) {
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        const tldHash = nameHash.tldHash.toString('hex');
        const found = domainCache_1.domainCache.tld.has(tldHash);
        if (!found)
            throw new Error('TLD not found');
        return domainCache_1.domainCache.tld.get(tldHash);
    }
    /**
     * @description Retrieves second level domains
     */
    async getSecondLevelDomains(topicId) {
        await new Promise(resolve => {
            this._subscriptions.push(pollingTopicSubscriber_1.PollingTopicSubscriber.subscribe(this.mirrorNode.networkType, topicId, messageObj => {
                const decoded = Buffer.from(messageObj.message, 'base64').toString();
                const sld = JSON.parse(decoded);
                const tldHash = sld.nameHash.tldHash;
                const sldHash = sld.nameHash.sldHash;
                if (domainCache_1.domainCache.slds.has(tldHash)) {
                    const sldDomainCache = domainCache_1.domainCache.slds.get(tldHash);
                    // TODO: replace if the one in cache is expired
                    if (!sldDomainCache.has(sldHash)) {
                        sldDomainCache.set(sldHash, sld);
                    }
                }
                else {
                    domainCache_1.domainCache.slds.set(tldHash, new Map([
                        [sldHash, sld]
                    ]));
                }
            }, () => {
                this._isCaughtUpWithTopic.set(topicId, true);
                resolve();
            }, undefined, this.mirrorNode.authKey));
        });
    }
    /**
     * @description Get the sld message on the TLD topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<SecondLevelDomain>}
     */
    // Improve method to look for unexpired domains
    async getSecondLevelDomain(nameHash) {
        const tld = await this.getTopLevelDomain(nameHash);
        const tldHash = nameHash.tldHash.toString('hex');
        const sldHash = nameHash.sldHash.toString('hex');
        let isCaughtUp = false;
        while (!isCaughtUp) {
            isCaughtUp = this._isCaughtUpWithTopic.get(tld.topicId);
            if (domainCache_1.domainCache.slds.has(tldHash)) {
                const sldCacheForTld = domainCache_1.domainCache.slds.get(tldHash);
                if (sldCacheForTld.has(sldHash)) {
                    return sldCacheForTld.get(sldHash);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${tld.topicId.toString()}]`);
    }
}
exports.Resolver = Resolver;
