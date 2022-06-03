/// <reference types="node" />
import { Client, ContractId, PrivateKey } from '@hashgraph/sdk';
/**
 * @description Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
 */
export declare const decodeFunctionResult: (functionName: string, abiPath: string, resultAsBytes: Uint8Array) => any;
/**
 * @description Encodes a function call so that the contract's function can be executed or called
 * @param functionName the name of the function to call
 * @param parameters the array of parameters to pass to the function
 */
export declare const encodeFunctionCall: (functionName: string, abiPath: string, parameters: string[]) => Buffer;
/**
 * @description Wrapper around Hedera SDK ContractExecuteTransaction
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param abiPath: {string} The path to the abi file of the contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {string[]} The parameters of the function to be called
 * @param keys: {PrivateKey[]} (optional) The keys required to sign the transaction
 */
export declare const callContractFunc: (contractId: ContractId, abiPath: string, funcName: string, funcParams: string[], client: Client, gas?: number, keys?: PrivateKey[] | null) => Promise<any>;
