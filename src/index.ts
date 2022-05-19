import {
  AccountBalanceQuery,
  AccountId,
  Client,
  NftId,
  PrivateKey,
  TokenId,
  TokenNftInfo,
  TokenNftInfoQuery,
} from '@hashgraph/sdk';
import keccak256 from 'keccak256';

import { getManagerInfo, ManagerInfo } from './manager';
import { callContractFunc } from './contract.utils';
import { logger } from './config/logger.config';

interface SerialInfo {
  serial: string;
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
   * @description Generate a hash of the provided domain string
   * @param domain: {string} The domain string to hash
   * @returns {Buffer}
   */
  static generateNFTHash = (domain: string): Buffer => {
    const subDomains = domain.split('.').reverse();
    return subDomains.reduce(
      (prev, curr) => keccak256(prev + curr),
      Buffer.from([0]),
    );
  };

  /**
   * @description Simple wrapper around callContractFunc for the getSerial smart contract function
   * @param domainHash: {Buffer} The hash of the domain to query
   * @param begin: {number} The begin index in the array of nodes of the manager
   * @param end: {number} The end index in the array of nodes of the manager
   * @returns {Promise<SerialInfo>}
   */
  private callGetSerial = async (
    domainHash: Buffer,
    begin: number,
    end: number,
  ): Promise<SerialInfo> => {
    try {
      const managerInfo: ManagerInfo = getManagerInfo();

      const result = await callContractFunc(
        managerInfo.contract.id,
        managerInfo.abi,
        'getSerial',
        [`0x${domainHash.toString('hex')}`, `${begin}`, `${end}`],
        this.client,
      );
      return { serial: result[0], node: result[1] };
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get owner');
    }
  };

  /**
 * @description Query the registry for the owner of a domain
 * @param domainHash: {Buffer} The hash of the domain to query
 * @returns {Promise<SerialInfo>}
 */
  private getDomainSerial = async (domainHash: Buffer): Promise<SerialInfo> => {
    let decodedResult: SerialInfo = { serial: '0', node: '0' };
    try {
      const managerInfo = getManagerInfo();

      const numNodes: number = (
        await callContractFunc(
          managerInfo.contract.id,
          managerInfo.abi,
          'getNumNodes',
          [],
          this.client,
        )
      )[0];

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
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get owner');
    }
  };

  /**
 * @description Simple wrapper around HTS TokenNftInfoQuery()
 * @param serial: {number} The serial of the NFT to query
 * @returns {Promise<TokenNftInfo>}
 */
  private getTokenNFTInfo = async (
    serial: number,
  ): Promise<TokenNftInfo> => {
    try {
      const nftId = new NftId(this.tokenId, serial);
      const nftInfo = await new TokenNftInfoQuery()
        .setNftId(nftId)
        .execute(this.client);
      return nftInfo[0];
    } catch (err) {
      logger.error(err);
      throw new Error('Get NFT info failed');
    }
  };

  /**
 * @description Wrapper around getDomainSerial() that takes a string of the domain
 * @param domain: {string} The domain to query
 * @returns {Promise<SerialInfo>}
 */
  getNFTSerialString = async (domain: string): Promise<SerialInfo> => this.getDomainSerial(HashgraphNames.generateNFTHash(domain));

  /**
 * @description Gets the serial for the domain, then queries for the AccountId who owns
 * that domain.
 * @param domain: {string} The domain to query
 * @returns {Promise<AccountId>}
 */
  getWallet = async (domain: string): Promise<AccountId> => {
    const { serial } = await this.getNFTSerialString(domain);
    const { accountId } = await this.getTokenNFTInfo(Number(serial));
    return accountId;
  };
}
