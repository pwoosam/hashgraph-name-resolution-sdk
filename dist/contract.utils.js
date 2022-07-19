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
exports.callDumpNames = exports.callGetSubdomainInfo = exports.callGetSLDInfo = exports.callGetSerial = exports.callGetSLDNode = exports.callGetTLD = exports.callGetNumNodes = exports.getSubdomainNodeABI = exports.getSLDNodeABI = exports.getTLDNodeAbi = exports.getTLDManagerInfo = exports.queryContractFunc = exports.callContractFunc = exports.decodeFunctionResult = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const web3_1 = __importDefault(require("web3"));
const sdk_1 = require("@hashgraph/sdk");
const logger_config_1 = require("./config/logger.config");
const constants_config_1 = require("./config/constants.config");
const web3 = new web3_1.default();
/**
 * @description Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
 */
const decodeFunctionResult = (functionName, abiPath, resultAsBytes) => {
    const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, abiPath), 'utf8'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionAbi = abi.find((func) => func.name === functionName);
    const functionParameters = functionAbi.outputs;
    const resultHex = '0x'.concat(Buffer.from(resultAsBytes).toString('hex'));
    const result = web3.eth.abi.decodeParameters(functionParameters, resultHex);
    return result;
};
exports.decodeFunctionResult = decodeFunctionResult;
/**
 * @description Wrapper around Hedera SDK ContractExecuteTransaction
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param abiPath: {string} The path to the abi file of the contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param client: {Client} The client to use for the transaction
 * @param gas: {number} (optional) The max gas to use for the call
 * @param keys: {PrivateKey[]} (optional) The keys required to sign the transaction
 * @returns {Promise<any>}
 */
const callContractFunc = async (client, contractId, abiPath, funcName, funcParams = new sdk_1.ContractFunctionParameters(), gas = constants_config_1.MAX_GAS, keys = null) => {
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
        return (0, exports.decodeFunctionResult)(funcName, abiPath, record.contractFunctionResult.bytes);
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
const queryContractFunc = async (client, contractId, abiPath, funcName, funcParams = new sdk_1.ContractFunctionParameters(), gas = constants_config_1.MAX_GAS) => {
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
        return (0, exports.decodeFunctionResult)(funcName, abiPath, response.bytes);
    }
    catch (err) {
        logger_config_1.logger.error(err);
        return new Error('queryContractFunc failed');
    }
};
exports.queryContractFunc = queryContractFunc;
/**
 * @description Retrieves information about the tld manager
 * @returns {ContractInfo}
 */
const getTLDManagerInfo = () => {
    const id = sdk_1.ContractId.fromString(constants_config_1.TLD_MANAGER_ID);
    const abi = constants_config_1.TLD_MANAGER_ABI;
    return { id, abi };
};
exports.getTLDManagerInfo = getTLDManagerInfo;
/**
 * @description Retrieves abi path for TLDNode
 * @returns {string}
 */
const getTLDNodeAbi = () => constants_config_1.TLD_NODE_ABI;
exports.getTLDNodeAbi = getTLDNodeAbi;
/**
  * @description Retrieves abi path for SLDNode
  * @returns {string}
  */
const getSLDNodeABI = () => constants_config_1.SLD_NODE_ABI;
exports.getSLDNodeABI = getSLDNodeABI;
/**
  * @description Retrieves abi path for SubdomainNode
  * @returns {string}
  */
const getSubdomainNodeABI = () => constants_config_1.SUBDOMAIN_NODE_ABI;
exports.getSubdomainNodeABI = getSubdomainNodeABI;
/**
 * @description Simple wrapper around callContractFunc for the getNumNodes smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @returns {Promise<number>}
 */
const callGetNumNodes = async (client, tldNodeId) => {
    try {
        const tldNodeAbi = (0, exports.getTLDNodeAbi)();
        const result = (await (0, exports.queryContractFunc)(client, tldNodeId, tldNodeAbi, 'getNumNodes'));
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
        const tldManagerInfo = (0, exports.getTLDManagerInfo)();
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(tldHash);
        const result = await (0, exports.queryContractFunc)(client, tldManagerInfo.id, tldManagerInfo.abi, 'getTLD', params);
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
        const tldNodeAbi = (0, exports.getTLDNodeAbi)();
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.sldHash)
            .addUint256(begin)
            .addUint256(end);
        const result = await (0, exports.queryContractFunc)(client, tldNodeId, tldNodeAbi, 'getSLDNode', params);
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
        const sldNodeAbi = (0, exports.getSLDNodeABI)();
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.sldHash);
        const result = await (0, exports.queryContractFunc)(client, sldNodeId, sldNodeAbi, 'getSerial', params);
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
        const sldNodeAbi = (0, exports.getSLDNodeABI)();
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.sldHash);
        const result = await (0, exports.queryContractFunc)(client, sldNodeId, sldNodeAbi, 'getSLDInfo', params);
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
        const subdomainNodeAbi = (0, exports.getSubdomainNodeABI)();
        const params = new sdk_1.ContractFunctionParameters()
            .addBytes32(nameHash.subdomainHash);
        const result = await (0, exports.queryContractFunc)(client, subdomainNodeId, subdomainNodeAbi, 'getSubdomainInfo', params);
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
        const subdomainNodeAbi = (0, exports.getSubdomainNodeABI)();
        const result = await (0, exports.queryContractFunc)(client, subdomainNodeId, subdomainNodeAbi, 'dumpNames');
        return result[0];
    }
    catch (err) {
        logger_config_1.logger.error(err);
        throw new Error('Failed to call getDomainInfo');
    }
};
exports.callDumpNames = callDumpNames;
// /**
//  * @description Simple wrapper around callContractFunc for the dumpNames smart contract function
//  * @param client: {Client} The client to use for the transaction
//  * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
//  * @returns {Promise<string[]>}
//  */
// export const callGetSubdomainOwner = async (
//   client: Client,
//   subdomainNodeId: ContractId,
//   nameHash: NameHash,
// ): Promise<string[]> => {
//   try {
//     const subdomainNodeAbi = getSubdomainNodeABI();
//     const params = new ContractFunctionParameters()
//       .addBytes32(nameHash.subdomainHash);
//     const result = await queryContractFunc(
//       client,
//       subdomainNodeId,
//       subdomainNodeAbi,
//       'getSubdomainOwner',
//       params,
//     );
//     return result[0];
//   } catch (err) {
//     logger.error(err);
//     throw new Error('Failed to call getDomainInfo');
//   }
// };
// =========================================
// getSubdomainOwner = async (domain: string): Promise<string[]> => {
//   try {
//     const nameHash = HashgraphNames.generateNameHash(domain);
//     const sldNodeId = await this.resolveSLDNode(nameHash);
//     const sldNodeInfo = await callGetSLDInfo(this.client, sldNodeId, nameHash);
//     const subdomainNodeId = ContractId.fromSolidityAddress(sldNodeInfo.subdomainNode);
//     return await callGetSubdomainOwner(this.client, subdomainNodeId, nameHash);
//   } catch (err) {
//     logger.error(err);
//     throw new Error('Failed to get SLD Info');
//   }
// };
// ============================================
