import {
  AccountBalanceQuery,
  AccountId,
  Client,
  NftId,
  PrivateKey,
  Status,
  TokenId,
  TokenMintTransaction,
  TokenNftInfo,
  TokenNftInfoQuery,
  TransactionReceipt,
} from '@hashgraph/sdk';
import keccak256 from 'keccak256';

import { getManagerInfo, ManagerInfo } from './manager';
import { callContractFunc } from './contract.utils';
import { CONFIRMATION_STATUS } from './config/constants.config';
import { logger } from './config/logger.config';

interface SerialInfo {
  serial: string;
  node: string;
}

export class HashgraphNames {
  operatorId: AccountId;
  operatorKey: PrivateKey;
  supplyKey: PrivateKey;
  client: Client;
  tokenId: TokenId = TokenId.fromString('0.0.34853601');

  constructor(operatorId: string, operatorKey: string, supplyKey: string) {
    this.operatorId = AccountId.fromString(operatorId);
    this.operatorKey = PrivateKey.fromString(operatorKey);
    this.supplyKey = PrivateKey.fromString(supplyKey);

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

  /**
 * @description Simple wrapper around HTS TokenMintTransaction()
 * @param metadata: {Buffer} The metadata to include on the newly minted NFT
 * @returns {Promise<TransactionReceipt>}
 */
  private mintNFT = async (
    metadata: Buffer,
  ): Promise<TransactionReceipt> => {
    try {
      const mintTx = await new TokenMintTransaction()
        .setTokenId(this.tokenId)
        .setMetadata([metadata])
        .freezeWith(this.client);
      const mintTxSign = await mintTx.sign(this.supplyKey);
      const mintTxSubmit = await mintTxSign.execute(this.client);
      const mintRx = await mintTxSubmit.getReceipt(this.client);
      if (mintRx.status._code !== Status.Success._code) {
        throw new Error('TokenMintTransaction failed');
      }
      return mintRx;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to mint NFT');
    }
  };

  /**
 * @description Check if a token is associated with a specific account
 * @param accountId: {AccountId} The account to check if the domain NFT is associated
 * @returns {Promise<boolean>}
 */
  private isTokenAssociatedToAccount = async (
    accountId: AccountId,
  ): Promise<boolean> => {
    try {
      const balanceCheckTx = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(this.client);

      if (!balanceCheckTx) {
        throw new Error('AccountBalanceQuery Failed');
      }

      const { tokens } = balanceCheckTx;
      if (tokens) {
        const tokenOfInterest = tokens._map.get(this.tokenId.toString());
        return tokenOfInterest !== undefined;
      }

      return false;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to determine if token is associated to account');
    }
  };

  /**
 * @description Check if a domain exists in the registry
 * @param domainHash: {Buffer} The hash of the domain to check
 * @returns {Promise<boolean>}
 */
  private checkDomainExists = async (
    domainHash: Buffer,
  ): Promise<boolean> => {
    try {
      const { serial } = await this.getDomainSerial(domainHash);
      return Number(serial) !== 0;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to check if domains exists');
    }
  };

  /**
 * @description Register a domain in the smart contract Registry
 * @param domainHash: {Buffer} The hash of the domain to add to the Registry
 * @param serial: {number} The serial of the NFT to register
 * @returns {Promise<number>}
 */
  private registerDomain = async (
    domainHash: Buffer,
    serial: number,
  ): Promise<number> => {
    try {
    // Get manager contract from env
      const managerInfo = getManagerInfo();

      // Add if not present
      await callContractFunc(
        managerInfo.contract.id,
        managerInfo.abi,
        'addRecord',
        [`0x${domainHash.toString('hex')}`, `${serial}`],
        this.client,
      );
      return CONFIRMATION_STATUS;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to register Domain');
    }
  };

  /**
 * @description Mints a new domain NFT and records it in the registry
 * @throws {@link InternalServerError}
 * @param domain {string} The domain to mint
 * @param ownerId {string} The owner of the domain to mint
 * @returns {Promise<number>}
 */
  mintDomain = async (
    domain: string,
    ownerId: string,
  ): Promise<number> => {
    let NFTSerial;
    let domainHash;

    const accountId = AccountId.fromString(ownerId);

    try {
      domainHash = HashgraphNames.generateNFTHash(domain);

      const domainExists = await this.checkDomainExists(domainHash);
      if (domainExists) throw new Error('Domain already exists in the registry');

      const isAssociated = await this.isTokenAssociatedToAccount(accountId);
      if (!isAssociated) throw new Error('Wallet must first be associated before a token can be minted');

      // Mint the NFT
      const mintRx = await this.mintNFT(domainHash);
      NFTSerial = Number(mintRx.serials[0]);

      // Register the domain in the Registry
      await this.registerDomain(domainHash, NFTSerial);

      return CONFIRMATION_STATUS;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to mint domain.');
    }
  };
  transferDomain = async () => {
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
