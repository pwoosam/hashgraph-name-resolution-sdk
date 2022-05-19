import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey,
  TokenId,
} from '@hashgraph/sdk';

import { getManagerInfo, ManagerInfo } from './manager';
import { callContractFunc } from './contract.utils';
import { logger } from './config/logger.config';

interface OwnerInfo {
  address: string;
  node: string;
}

export class HashgraphNames {
  operatorId: AccountId;
  operatorKey: PrivateKey;
  client: Client;
  tokenId: TokenId = TokenId.fromString('0.0.34853601');

  constructor(operatorId: AccountId, operatorKey: PrivateKey) {
    this.operatorId = operatorId;
    this.operatorKey = operatorKey;

    this.client = Client.forTestnet().setOperator(this.operatorId, this.operatorKey);
  }

  printBalance = async (accountId: AccountId) => {
    const balanceCheckTx = await new AccountBalanceQuery()
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

  mintDomain = async () => {
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
  getSerial = async (
    domainHash: Buffer,
    begin: number,
    end: number,
  ): Promise<OwnerInfo> => {
    try {
      const managerInfo: ManagerInfo = getManagerInfo();

      const result = await callContractFunc(
        managerInfo.contract.id,
        managerInfo.abi,
        'getSerial',
        [`0x${domainHash.toString('hex')}`, `${begin}`, `${end}`],
        this.client,
      );
      return { address: result[0], node: result[1] };
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get owner');
    }
  };
}
