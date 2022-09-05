"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = void 0;
const mirrorNode_1 = require("./mirrorNode");
const hashDomain_1 = require("./hashDomain");
const tldTopicId = '0.0.48097305';
class Resolver {
    constructor(networkType, authKey = '') {
        this.topLevelDomains = [];
        this.mirrorNode = new mirrorNode_1.MirrorNode(networkType, authKey);
    }
    async init() {
        this.topLevelDomains = await this.getTopLevelDomains();
    }
    /**
   * @description Resolves a Second Level Domain to the wallet address of the domain's owner
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
    async resolveSLD(domain) {
        try {
            const nameHash = (0, hashDomain_1.hashDomain)(domain);
            const sld = await this.getSecondLevelDomain(nameHash);
            const [tokenId, serial] = sld.nftId.split(':');
            const nft = await this.mirrorNode.getNFT(tokenId, serial);
            return nft.account_id;
        }
        catch (err) {
            throw err;
        }
    }
    ;
    // Private
    /**
   * @description Retrieves and stores top level domains
   */
    async getTopLevelDomains() {
        const response = await this.mirrorNode.getTopicMessages(tldTopicId, 0);
        const messages = response;
        return messages.map((messageObject) => {
            const decoded = Buffer.from(messageObject.message, 'base64').toString();
            return JSON.parse(decoded);
        });
    }
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    getTopLevelDomain(nameHash) {
        const found = this.topLevelDomains.find((tld) => (tld.nameHash.tldHash === nameHash.tldHash.toString('hex')));
        if (!found)
            throw new Error('TLD not found');
        return found;
    }
    /**
   * @description Retrieves second level domains
   */
    async getSecondLevelDomains(topicId, offset) {
        const response = await this.mirrorNode.getTopicMessages(topicId, offset);
        const messages = response;
        return messages.map((messageObject) => {
            const decoded = Buffer.from(messageObject.message, 'base64').toString();
            return JSON.parse(decoded);
        });
    }
    /**
     * @description Get the sld message on the TLD topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @param inputTopicId: {TopicId | null} The topic id to use for the query. If none is provided,
     * the manager topic will be queried first to get the topic for the namehash
     * @returns {Promise<SecondLevelDomain>}
     */
    // Improve method to look for unexpired domains
    async getSecondLevelDomain(nameHash) {
        const tld = this.getTopLevelDomain(nameHash);
        for (let offset = 0;; offset++) {
            const slds = await this.getSecondLevelDomains(tld.topicId, offset);
            const sld = slds.find((sld) => sld.nameHash.sldHash === nameHash.sldHash.toString('hex'));
            if (sld)
                return sld;
        }
        throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${tld.topicId.toString()}]`);
    }
}
exports.Resolver = Resolver;
