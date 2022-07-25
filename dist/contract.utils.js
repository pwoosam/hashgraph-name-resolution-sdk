"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryNFTsFromRestAPI = exports.callDumpNames = exports.callGetSubdomainInfo = exports.callGetSLDInfo = exports.callGetSerial = exports.callGetSLDNode = exports.callGetTLD = exports.callGetNumNodes = exports.getTLDManagerId = exports.queryContractFunc = exports.callContractFunc = exports.decodeFunctionResult = void 0;
const sdk_1 = require("@hashgraph/sdk");
const axios_1 = __importDefault(require("axios"));
const web3_1 = __importDefault(require("web3"));
const constants_config_1 = require("./config/constants.config");
const logger_config_1 = require("./config/logger.config");
const SLDNode = __importStar(require("./contracts/abi/src_contracts_SLDNode_sol_SLDNode.json"));
const SubdomainNode = __importStar(require("./contracts/abi/src_contracts_SubdomainNode_sol_SubdomainNode.json"));
const TLDManager = __importStar(require("./contracts/abi/src_contracts_TLDManager_sol_TLDManager.json"));
const TLDNode = __importStar(require("./contracts/abi/src_contracts_TLDNode_sol_TLDNode.json"));
const web3 = new web3_1.default();
/**
 * @description Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
 */
const decodeFunctionResult = (functionName, contractType, resultAsBytes) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let abi;
    switch (contractType) {
        case constants_config_1.ContractTypes.SLDNode:
            abi = SLDNode;
            break;
        case constants_config_1.ContractTypes.SubdomainNode:
            abi = SubdomainNode;
            break;
        case constants_config_1.ContractTypes.TLDManager:
            abi = TLDManager;
            break;
        case constants_config_1.ContractTypes.TLDNode:
            abi = TLDNode;
            break;
        default:
            throw new Error('Invalid Node Type');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionAbi = abi.default.find((func) => func.name === functionName);
    const functionParameters = functionAbi.outputs;
    const resultHex = '0x'.concat(Buffer.from(resultAsBytes).toString('hex'));
    const result = web3.eth.abi.decodeParameters(functionParameters, resultHex);
    return result;
};
exports.decodeFunctionResult = decodeFunctionResult;
/**
 * @description Wrapper around Hedera SDK ContractExecuteTransaction
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param nodeType: {NodeType} The type contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param client: {Client} The client to use for the transaction
 * @param gas: {number} (optional) The max gas to use for the call
 * @param keys: {PrivateKey[]} (optional) The keys required to sign the transaction
 * @returns {Promise<any>}
 */
const callContractFunc = async (client, contractId, contractType, funcName, funcParams = new sdk_1.ContractFunctionParameters(), gas = constants_config_1.MAX_GAS, keys = null) => {
    try {
        // TODO: Remove
        // eslint-disable-next-line no-console
        console.log(`Hitting Contract: ${contractId}::${funcName}`);
        const tx = new sdk_1.ContractExecuteTransaction()
            .setContractId(contractId)
            .setFunction(funcName, funcParams)
            .setGas(gas)
            .freezeWith(client);
        if (keys) {
            const promises = keys.map((key) => tx.sign(key));
            await Promise.all(promises);
        }
        const response = await tx.execute(client);
        const record = await response.getRecord(client);
        if (!record || !record.contractFunctionResult || record.receipt.status._code !== sdk_1.Status.Success._code) {
            throw new Error('ContractExecuteTransaction failed');
        }
        return (0, exports.decodeFunctionResult)(funcName, contractType, record.contractFunctionResult.bytes);
    }
    catch (err) {
        logger_config_1.logger.error(err);
        return new Error('callContractFunc failed');
    }
};
exports.callContractFunc = callContractFunc;
/**
 * @description Wrapper around Hedera SDK ContractCallQuery
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param abiPath: {string} The path to the abi file of the contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param client: {Client} The client to use for the transaction
 * @param gas: {number} (optional) The max gas to use for the call
 * @returns {Promise<any>}
 */
const queryContractFunc = async (client, contractId, contractType, funcName, funcParams = new sdk_1.ContractFunctionParameters(), gas = constants_config_1.MAX_GAS) => {
    try {
        // TODO: Remove
        // eslint-disable-next-line no-console
        console.log(`Hitting Contract: ${contractId}::${funcName}`);
        const tx = new sdk_1.ContractCallQuery()
            .setContractId(contractId)
            .setFunction(funcName, funcParams)
            .setGas(gas)
            .setQueryPayment(new sdk_1.Hbar(1));
        const response = await tx.execute(client);
        if (!response || !response.bytes) {
            throw new Error('ContractCallQuery failed');
        }
        return (0, exports.decodeFunctionResult)(funcName, contractType, response.bytes);
    }
    catch (err) {
        logger_config_1.logger.error(err);
        return new Error('queryContractFunc failed');
    }
};
exports.queryContractFunc = queryContractFunc;
/**
 * @description Retrieves the tld manager id
 * @returns {ContractInfo}
 */
const getTLDManagerId = () => sdk_1.ContractId.fromString(constants_config_1.TLD_MANAGER_ID);
exports.getTLDManagerId = getTLDManagerId;
/**
 * @description Simple wrapper around callContractFunc for the getNumNodes smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @returns {Promise<number>}
 */
const callGetNumNodes = async (client, tldNodeId) => {
    try {
        const result = (await (0, exports.queryContractFunc)(client, tldNodeId, constants_config_1.ContractTypes.TLDNode, 'getNumNodes'));
        return Number(result[0]);
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getNumNodes');
    }
};
exports.callGetNumNodes = callGetNumNodes;
/**
 * @description Simple wrapper around callContractFunc for the getTLD smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param tldHash: {Buffer} The hash of the TLD you wish to query
 * @returns {Promise<ContractId>}
 */
const callGetTLD = async (client, tldHash) => {
    try {
        const tldManagerId = (0, exports.getTLDManagerId)();
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(tldHash);
        const result = await (0, exports.queryContractFunc)(client, tldManagerId, constants_config_1.ContractTypes.TLDManager, 'getTLD', params);
        return sdk_1.ContractId.fromSolidityAddress(result[0]);
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getTLD');
    }
};
exports.callGetTLD = callGetTLD;
/**
 * @description Simple wrapper around callContractFunc for the getSLDNode smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param nameHash: {NameHash} The NameHash of the domain to query
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @param begin: {number} The begin index in the array of nodes of the manager
 * @param end: {number} The end index in the array of nodes of the manager
 * @returns {Promise<ContractId>}
 */
const callGetSLDNode = async (client, nameHash, tldNodeId, begin = 0, end = 0) => {
    try {
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.sldHash)
            .addUint256(begin)
            .addUint256(end);
        const result = await (0, exports.queryContractFunc)(client, tldNodeId, constants_config_1.ContractTypes.TLDNode, 'getSLDNode', params);
        return sdk_1.ContractId.fromSolidityAddress(result[0]);
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getSLDNode');
    }
};
exports.callGetSLDNode = callGetSLDNode;
/**
 * @description Simple wrapper around callContractFunc for the getSerial smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param sldNodeId: {ContractId} The contract to query for the domain
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<number>}
 */
const callGetSerial = async (client, sldNodeId, nameHash) => {
    try {
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.sldHash);
        const result = await (0, exports.queryContractFunc)(client, sldNodeId, constants_config_1.ContractTypes.SLDNode, 'getSerial', params);
        return Number(result[0]);
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getSerial');
    }
};
exports.callGetSerial = callGetSerial;
/**
 * @description Simple wrapper around callContractFunc for the getSLDInfo smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param sldNodeId: {ContractId} The contract id to query for the SLDInfo
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<SLDInfo>}
 */
const callGetSLDInfo = async (client, sldNodeId, nameHash) => {
    try {
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.sldHash);
        const result = await (0, exports.queryContractFunc)(client, sldNodeId, constants_config_1.ContractTypes.SLDNode, 'getSLDInfo', params);
        return result[0];
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getDomainInfo');
    }
};
exports.callGetSLDInfo = callGetSLDInfo;
/**
 * @description Simple wrapper around callContractFunc for the getSubdomainInfo smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<SubdomainInfo>}
 */
const callGetSubdomainInfo = async (client, subdomainNodeId, nameHash) => {
    try {
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.subdomainHash);
        const result = await (0, exports.queryContractFunc)(client, subdomainNodeId, constants_config_1.ContractTypes.SubdomainNode, 'getSubdomainInfo', params);
        return result[0];
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getDomainInfo');
    }
};
exports.callGetSubdomainInfo = callGetSubdomainInfo;
/**
 * @description Simple wrapper around callContractFunc for the dumpNames smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
 * @returns {Promise<string[]>}
 */
const callDumpNames = async (client, subdomainNodeId) => {
    try {
        const result = await (0, exports.queryContractFunc)(client, subdomainNodeId, constants_config_1.ContractTypes.SubdomainNode, 'dumpNames');
        return result[0];
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getDomainInfo');
    }
};
exports.callDumpNames = callDumpNames;
/**
 * @description Issues a Rest API request to get all NFTs in a wallet
 * @param client: {Client} The client to use for the transaction
 * @param tokenId: {TokenId} Id of token of interest for the query
 * @returns {Promise<string[]>}
 */
const queryNFTsFromRestAPI = async (client, tokenId) => {
    var _a;
    try {
        const accountId = (_a = client.operatorAccountId) === null || _a === void 0 ? void 0 : _a.toString();
        let url;
        switch (constants_config_1.NETWORK) {
            case 'testnet':
                url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts/?token.id=${tokenId}`;
                break;
            case 'mainnet':
                url = `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts/?token.id=${tokenId}`;
                break;
            default:
                throw new Error('Invalid Network');
        }
        const config = {
            method: 'get',
            url,
        };
        const res = await (0, axios_1.default)(config);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nfts = res.data.nfts.map((t) => ({
            accountId: t.account_id,
            metadata: Buffer.from(t.metadata, 'base64').toString(),
            serialNumber: t.serial_number,
            tokenId: t.token_id,
        }));
        return nfts;
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to get All SLDs');
    }
};
exports.queryNFTsFromRestAPI = queryNFTsFromRestAPI;
