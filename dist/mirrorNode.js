"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MirrorNode = exports.NetworkBaseURL = exports.TLD_TOPIC_ID = void 0;
const axios_1 = __importDefault(require("axios"));
exports.TLD_TOPIC_ID = '0.0.47954429';
var NetworkBaseURL;
(function (NetworkBaseURL) {
    NetworkBaseURL["hedera_test"] = "https://testnet.mirrornode.hedera.com/api/v1";
    NetworkBaseURL["hedera_main"] = "https://mainnet-public.mirrornode.hedera.com/api/v1";
    NetworkBaseURL["lworks_test"] = "https://testnet.mirror.lworks.io/api/v1";
    NetworkBaseURL["lworks_main"] = "https://mainnet.mirror.lworks.io/api/v1";
    NetworkBaseURL["arkhia_test"] = "https://hedera.testnet.arkhia.io/api/v1";
    NetworkBaseURL["arkhia_main"] = "https://hedera.mainnet.arkhia.io/api/v1";
})(NetworkBaseURL = exports.NetworkBaseURL || (exports.NetworkBaseURL = {}));
// Max page size allowed by hedera nodes
const MAX_PAGE_SIZE = 100;
class MirrorNode {
    constructor(networkType, authKey = '') {
        this.networkType = networkType;
        this.baseUrl = this.getBaseUrl();
        this.authKey = authKey;
    }
    async getTopicMessages(topicId, offset) {
        let sequenceNumber;
        offset === 0 ? sequenceNumber = offset + 1 : sequenceNumber = (offset + 1) * MAX_PAGE_SIZE;
        const url = `${this.getBaseUrl()}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${MAX_PAGE_SIZE}`;
        const res = await this.sendGetRequest(url);
        return res.data.messages;
    }
    async getNFT(tokenId, serial) {
        const url = `${this.getBaseUrl()}/tokens/${tokenId}/nfts/${serial}`;
        const res = await this.sendGetRequest(url);
        return res.data;
    }
    // Private
    getBaseUrl() {
        switch (this.networkType) {
            case 'hedera_test':
                return NetworkBaseURL.hedera_test;
            case 'hedera_main':
                return NetworkBaseURL.hedera_main;
            case 'lworks_test':
                return NetworkBaseURL.lworks_test;
            case 'lworks_main':
                return NetworkBaseURL.lworks_main;
            case 'arkhia_test':
                return NetworkBaseURL.arkhia_test;
            case 'arkhia_main':
                return NetworkBaseURL.arkhia_main;
            default:
                throw new Error('No base URL available for NetworkType');
        }
    }
    async sendGetRequest(url) {
        try {
            const res = await axios_1.default.get(url, {
                headers: {
                    Authorization: this.authKey,
                },
            });
            return res;
        }
        catch (err) {
            throw new Error('Get Request Failed');
        }
    }
}
exports.MirrorNode = MirrorNode;
