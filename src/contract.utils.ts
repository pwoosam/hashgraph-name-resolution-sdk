import * as fs from 'fs';
import * as path from 'path';
import Web3 from 'web3';
import {
  Client,
  ContractExecuteTransaction,
  ContractId,
  PrivateKey,
  Status,
} from '@hashgraph/sdk';
import { logger } from './config/logger.config';
import { MAX_GAS } from './config/constants.config';

const web3 = new Web3();

/**
 * @description Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
 */
export const decodeFunctionResult = (
  functionName: string,
  abiPath: string,
  resultAsBytes: Uint8Array,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, abiPath), 'utf8'));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionAbi = abi.find((func: any) => func.name === functionName);
  const functionParameters = functionAbi.outputs;
  const resultHex = '0x'.concat(Buffer.from(resultAsBytes).toString('hex'));
  const result = web3.eth.abi.decodeParameters(functionParameters, resultHex);
  return result;
};

/**
 * @description Encodes a function call so that the contract's function can be executed or called
 * @param functionName the name of the function to call
 * @param parameters the array of parameters to pass to the function
 */
export const encodeFunctionCall = (
  functionName: string,
  abiPath: string,
  parameters: string[],
): Buffer => {
  const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, abiPath), 'utf8'));

  const functionAbi = abi.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (func: any) => func.name === functionName && func.type === 'function',
  );
  const encodedParametersHex = web3.eth.abi
    .encodeFunctionCall(functionAbi, parameters)
    .slice(2);
  return Buffer.from(encodedParametersHex, 'hex');
};

/**
 * @description Wrapper around Hedera SDK ContractExecuteTransaction
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param abiPath: {string} The path to the abi file of the contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {string[]} The parameters of the function to be called
 * @param keys: {PrivateKey[]} (optional) The keys required to sign the transaction
 */
export const callContractFunc = async (
  contractId: ContractId,
  abiPath: string,
  funcName: string,
  funcParams: string[],
  client: Client,
  gas = MAX_GAS,
  keys: PrivateKey[] | null = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  try {
    const tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setFunctionParameters(
        encodeFunctionCall(funcName, abiPath, funcParams || []),
      )
      .setGas(gas)
      .freezeWith(client);

    if (keys) {
      const promises = keys.map((key) => tx.sign(key));
      await Promise.all(promises);
    }

    const response = await tx.execute(client);
    const record = await response.getRecord(client);
    if (
      !record || !record.contractFunctionResult || record.receipt.status._code !== Status.Success._code
    ) {
      throw new Error('ContractExecuteTransaction failed');
    }

    return decodeFunctionResult(
      funcName,
      abiPath,
      record.contractFunctionResult.bytes,
    );
  } catch (err) {
    logger.error(err);
    return new Error('callContractFunc failed');
  }
};
