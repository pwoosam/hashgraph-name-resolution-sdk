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
exports.callContractFunc = exports.encodeFunctionCall = exports.decodeFunctionResult = void 0;
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
 * @description Encodes a function call so that the contract's function can be executed or called
 * @param functionName the name of the function to call
 * @param parameters the array of parameters to pass to the function
 */
const encodeFunctionCall = (functionName, abiPath, parameters) => {
    const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, abiPath), 'utf8'));
    const functionAbi = abi.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (func) => func.name === functionName && func.type === 'function');
    const encodedParametersHex = web3.eth.abi
        .encodeFunctionCall(functionAbi, parameters)
        .slice(2);
    return Buffer.from(encodedParametersHex, 'hex');
};
exports.encodeFunctionCall = encodeFunctionCall;
/**
 * @description Wrapper around Hedera SDK ContractExecuteTransaction
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param abiPath: {string} The path to the abi file of the contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {string[]} The parameters of the function to be called
 * @param keys: {PrivateKey[]} (optional) The keys required to sign the transaction
 */
const callContractFunc = async (contractId, abiPath, funcName, funcParams, client, gas = constants_config_1.MAX_GAS, keys = null) => {
    try {
        const tx = new sdk_1.ContractExecuteTransaction()
            .setContractId(contractId)
            .setFunctionParameters((0, exports.encodeFunctionCall)(funcName, abiPath, funcParams || []))
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
