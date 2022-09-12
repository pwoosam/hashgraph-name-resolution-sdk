"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = exports.MAIN_TLD_TOPIC_ID = exports.TEST_TLD_TOPIC_ID = void 0;
const hashDomain_1 = require("./hashDomain");
const mirrorNode_1 = require("./mirrorNode");
exports.TEST_TLD_TOPIC_ID = '0.0.48097305';
exports.MAIN_TLD_TOPIC_ID = '0.0.1234189';
class Resolver {
    constructor(networkType, authKey = '') {
        this.topLevelDomains = [];
        this.mirrorNode = new mirrorNode_1.MirrorNode(networkType, authKey);
    }
    async init() {
        const { topLevelDomains } = await this.getTopLevelDomains();
        if (topLevelDomains) {
            this.topLevelDomains = topLevelDomains;
        }
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
        const response = await this.mirrorNode.getTopicMessages(this.getTldTopicId(), null);
        response.topLevelDomains = response.messages.map((messageObject) => {
            const decoded = Buffer.from(messageObject.message, 'base64').toString();
            return JSON.parse(decoded);
        });
        return response;
    }
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    getTopLevelDomain(nameHash) {
        const found = this.topLevelDomains.find((tld) => tld.nameHash.tldHash === nameHash.tldHash.toString('hex'));
        if (!found)
            throw new Error('TLD not found');
        return found;
    }
    /**
     * @description Retrieves second level domains
     */
    async getSecondLevelDomains(topicId, next) {
        const response = await this.mirrorNode.getTopicMessages(topicId, next);
        response.secondLevelDomains = response.messages.map((messageObject) => {
            const decoded = Buffer.from(messageObject.message, 'base64').toString();
            return JSON.parse(decoded);
        });
        return response;
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
        let sld;
        let next = null;
        do {
            // eslint-disable-next-line no-await-in-loop
            const { secondLevelDomains, links } = await this.getSecondLevelDomains(tld.topicId, next);
            if (secondLevelDomains) {
                sld = secondLevelDomains.find((item) => item.nameHash.sldHash === nameHash.sldHash.toString('hex'));
                if (sld === undefined) {
                    next = links.next;
                }
            }
            else {
                next = null;
            }
        } while (sld === undefined && next);
        if (sld)
            return sld;
        throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${tld.topicId.toString()}]`);
    }
}
exports.Resolver = Resolver;
