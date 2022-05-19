"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
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
         * @returns {Promise<OwnerInfo>}
         */
        this.getSerial = async (domainHash, begin, end) => {
            try {
                const managerInfo = (0, manager_1.getManagerInfo)();
                const result = await (0, contract_utils_1.callContractFunc)(managerInfo.contract.id, managerInfo.abi, 'getSerial', [`0x${domainHash.toString('hex')}`, `${begin}`, `${end}`], this.client);
                return { address: result[0], node: result[1] };
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to get owner');
            }
        };
        this.operatorId = operatorId;
        this.operatorKey = operatorKey;
        this.client = sdk_1.Client.forTestnet().setOperator(this.operatorId, this.operatorKey);
    }
}
exports.HashgraphNames = HashgraphNames;
