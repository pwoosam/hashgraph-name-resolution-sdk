"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
const keccak256_1 = __importDefault(require("keccak256"));
const manager_1 = require("./manager");
const contract_utils_1 = require("./contract.utils");
const logger_config_1 = require("./config/logger.config");
class HashgraphNames {
    constructor(operatorId, operatorKey) {
        this.tokenId = sdk_1.TokenId.fromString('0.0.34853601');
        this.printBalance = async (accountId) => {
            const balanceCheckTx = await new sdk_1.AccountBalanceQuery()
                .setAccountId(accountId)
                .execute(this.client);
            if (!balanceCheckTx) {
                throw new Error('AccountBalanceQuery Failed');
            }
            let nftBalance = 0;
            if (balanceCheckTx.tokens) {
                nftBalance = Number(balanceCheckTx.tokens._map.get(this.tokenId.toString()));
            }
            return {
                nft: nftBalance,
                hbar: Number(balanceCheckTx.hbars.toTinybars()),
            };
        };
        this.mintDomain = async () => {
            // eslint-disable-next-line no-console
            console.log(this.operatorId);
        };
        /**
         * @description Simple wrapper around callContractFunc for the getSerial smart contract function
         * @param domainHash: {Buffer} The hash of the domain to query
         * @param begin: {number} The begin index in the array of nodes of the manager
         * @param end: {number} The end index in the array of nodes of the manager
         * @returns {Promise<SerialInfo>}
         */
        this.callGetSerial = async (domainHash, begin, end) => {
            try {
                const managerInfo = (0, manager_1.getManagerInfo)();
                const result = await (0, contract_utils_1.callContractFunc)(managerInfo.contract.id, managerInfo.abi, 'getSerial', [`0x${domainHash.toString('hex')}`, `${begin}`, `${end}`], this.client);
                return { serial: result[0], node: result[1] };
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to get owner');
            }
        };
        /**
       * @description Query the registry for the owner of a domain
       * @param domainHash: {Buffer} The hash of the domain to query
       * @returns {Promise<SerialInfo>}
       */
        this.getDomainSerial = async (domainHash) => {
            let decodedResult = { serial: '0', node: '0' };
            try {
                const managerInfo = (0, manager_1.getManagerInfo)();
                const numNodes = (await (0, contract_utils_1.callContractFunc)(managerInfo.contract.id, managerInfo.abi, 'getNumNodes', [], this.client))[0];
                const chunkSize = 100;
                let begin = 0;
                let end = 0;
                for (let i = 0; end < numNodes; i += 1) {
                    end = Number((i + 1) * chunkSize);
                    // eslint-disable-next-line no-await-in-loop
                    decodedResult = await this.callGetSerial(domainHash, begin, end);
                    if (Number(decodedResult.serial) !== Number(0)) {
                        // Found the owner
                        break;
                    }
                    begin = end;
                }
                return decodedResult;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to get owner');
            }
        };
        /**
       * @description Wrapper around getDomainOwner() that takes a string of the domain
       * @param domain: {string} The domain to query
       * @returns {Promise<SerialInfo>}
       */
        this.getNFTSerialString = async (domain) => this.getDomainSerial(HashgraphNames.generateNFTHash(domain));
        this.operatorId = operatorId;
        this.operatorKey = operatorKey;
        this.client = sdk_1.Client.forTestnet().setOperator(this.operatorId, this.operatorKey);
    }
}
exports.HashgraphNames = HashgraphNames;
/**
 * @description Generate a hash of the provided domain string
 * @param domain: {string} The domain string to hash
 * @returns {Buffer}
 */
HashgraphNames.generateNFTHash = (domain) => {
    const subDomains = domain.split('.').reverse();
    return subDomains.reduce((prev, curr) => (0, keccak256_1.default)(prev + curr), Buffer.from([0]));
};
