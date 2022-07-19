import {
  AccountId,
  Client,
  ContractId,
  Hbar,
  NftId,
  PrivateKey,
  PublicKey,
  Status,
  TokenId,
  TokenNftInfo,
  TokenNftInfoQuery,
  Transaction,
  TransferTransaction,
} from '@hashgraph/sdk';
import keccak256 from 'keccak256';
import {
  CONFIRMATION_STATUS,
  NameHash,
  NFTMetadata,
  NULL_CONTRACT_ID,
  SLDInfo,
  SubdomainInfo,
  TOKEN_ID,
} from './config/constants.config';
import { logger } from './config/logger.config';
import {
  callDumpNames,
  callGetNumNodes,
  callGetSerial,
  callGetSLDInfo,
  callGetSLDNode,
  callGetSubdomainInfo,
  callGetTLD,
} from './contract.utils';

interface TransactionSignature {
  signerPublicKey: PublicKey;
  signature: Uint8Array;
}

export class HashgraphNames {
  operatorId: AccountId;
  operatorKey: PrivateKey;
  client: Client;
  tokenId: TokenId = TokenId.fromString(TOKEN_ID);

  constructor(operatorId: string, operatorKey: string) {
    this.operatorId = AccountId.fromString(operatorId);
    this.operatorKey = PrivateKey.fromString(operatorKey);

    this.client = Client
      .forTestnet()
      .setOperator(this.operatorId, this.operatorKey);
  }

  static generateMetadata = (domain: string): NFTMetadata => {
    const metadata: NFTMetadata = {
      name: domain,
      creator: 'piefi labs',
      // creatorDID: '',
      // description: 'Hashgraph Naming service domain',
      // image: '[cid or path to NFT\'s image]',
      // type: 'image/jpeg', // TODO: Change this to whatever file type we end up generating for the NFT images
      // files: [],
      // format: 'none',
      // properties: [],
      // localization: [],
    };

    return metadata;
  };

  /**
 * @description Generate a NameHash of the provided domain string
 * @param domain: {string} The domain string to hash
 * @returns {Buffer}
 */
  static generateNameHash = (domain: string): NameHash => {
    if (!domain) {
      return {
        domain,
        tldHash: Buffer.from([0x0]),
        sldHash: Buffer.from([0x0]),
        subdomainHash: Buffer.from([0x0]),
      };
    }
    const domainsList = domain.split('.').reverse();
    const tld = domainsList[0];
    let sld;
    let subdomains;
    if (domainsList.length > 1) {
      sld = domainsList.slice(0, 2);
    }
    if (domainsList.length > 2) {
      subdomains = domainsList;
    }

    let tldHash = Buffer.from([0x0]);
    let sldHash = Buffer.from([0x0]);
    let subdomainHash = Buffer.from([0x0]);

    if (tld) {
      tldHash = keccak256(tld);
    }
    if (sld) {
      sldHash = sld.reduce(
        (prev, curr) => keccak256(prev + curr),
        Buffer.from(''),
      );
    }
    if (subdomains) {
      subdomainHash = subdomains.reduce(
        (prev, curr) => keccak256(prev + curr),
        Buffer.from(''),
      );
    }
    return { domain, tldHash, sldHash, subdomainHash };
  };

  /**
 * @description Query the registry for the SLDNode responsible for a domain
 * @param nameHash: {NameHash} The NameHash of the domain to query
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @returns {Promise<ContractId>}
 */
  private getSLDNode = async (
    nameHash: NameHash,
    tldNodeId: ContractId = NULL_CONTRACT_ID,
  ): Promise<ContractId> => {
    try {
      let decodedResult: ContractId = NULL_CONTRACT_ID;
      let tldId: ContractId = tldNodeId;
      if (tldId === NULL_CONTRACT_ID) {
        tldId = await callGetTLD(this.client, nameHash.tldHash);
      }

      const numNodes = await callGetNumNodes(this.client, tldId);

      const chunkSize = 100;
      let begin = 0;
      let end = 0;
      for (let i = 0; end < numNodes; i += 1) {
        end = Number((i + 1) * chunkSize);
        // eslint-disable-next-line no-await-in-loop
        decodedResult = await callGetSLDNode(this.client, nameHash, tldId, begin, end);
        if (decodedResult !== NULL_CONTRACT_ID) {
        // Found the owner
          break;
        }
        begin = end;
      }
      return decodedResult;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get SLDNode');
    }
  };

  /**
 * @description Takes a nameHash and returns the SLD that contains it
 * @param nameHash: {Buffer} The nameHash of the domain to be queried
 * @returns {Promise<ContractId>}
 */
  private resolveSLDNode = async (nameHash: NameHash): Promise<ContractId> => {
    try {
      const tldNodeId = await callGetTLD(this.client, nameHash.tldHash);
      if (String(tldNodeId) === String(NULL_CONTRACT_ID)) {
        throw new Error('Failed to getTLDNode');
      }

      const sldNodeId = await this.getSLDNode(nameHash, tldNodeId);
      if (String(sldNodeId) === String(NULL_CONTRACT_ID)) {
        throw new Error('Failed to getSLDNode');
      }

      return sldNodeId;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to resolve SLD');
    }
  };

  /**
 * @description Resolves a Second Level Domain to the wallet address of the domain's owner
 * @param domain: {string} The domain to query
 * @returns {Promise<AccountId>}
 */
  resolveSLD = async (domain: string): Promise<AccountId> => {
    try {
      const nameHash = HashgraphNames.generateNameHash(domain);
      const sldNodeId = await this.resolveSLDNode(nameHash);
      const serial: number = await callGetSerial(this.client, sldNodeId, nameHash);
      const { accountId } = await this.getTokenNFTInfo(serial);

      return accountId;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get wallet');
    }
  };

  /**
 * @description Get the SLDInfo for a given domain
 * @param domain: {string} The domain to query
 * @returns {Promise<SLDInfo>}
 */
  getSLDInfo = async (domain: string): Promise<SLDInfo> => {
    try {
      const nameHash = HashgraphNames.generateNameHash(domain);
      const sldNodeId = await this.resolveSLDNode(nameHash);
      return await callGetSLDInfo(this.client, sldNodeId, nameHash);
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get SLD Info');
    }
  };

  /**
 * @description Get the SubdomainInfo for a given domain
 * @param domain: {string} The domain to query
 * @returns {Promise<SubdomainInfo>}
 */
  getSubdomainInfo = async (domain: string): Promise<SubdomainInfo> => {
    try {
      const nameHash = HashgraphNames.generateNameHash(domain);
      const sldNodeId = await this.resolveSLDNode(nameHash);
      const sldNodeInfo = await callGetSLDInfo(this.client, sldNodeId, nameHash);
      const subdomainNodeId = ContractId.fromSolidityAddress(sldNodeInfo.subdomainNode);
      return await callGetSubdomainInfo(this.client, subdomainNodeId, nameHash);
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get SLD Info');
    }
  };

  /**
 * @description Get all subdomains for a given domain
 * @param domain: {string} The domain to query
 * @returns {Promise<string[]>}
 */
  getSLDSubdomains = async (domain: string): Promise<string[]> => {
    try {
      const nameHash = HashgraphNames.generateNameHash(domain);
      const sldNodeId = await this.resolveSLDNode(nameHash);
      const sldNodeInfo = await callGetSLDInfo(this.client, sldNodeId, nameHash);
      const subdomainNodeId = ContractId.fromSolidityAddress(sldNodeInfo.subdomainNode);
      return await callDumpNames(this.client, subdomainNodeId);
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get SLD Info');
    }
  };

  /**
 * @description Helper function to convert an Uint8Array into an Hedera Transaction type
 * @param transactionBytes: {Uint8Array} The transaction bytes to be converted
 */
  private static bytesToTransaction = (transactionBytes: Uint8Array): Transaction => {
    const uint8Array = new Uint8Array(transactionBytes);
    const transaction: Transaction = Transaction.fromBytes(uint8Array);
    return transaction;
  };

  /**
 * @description Executes an HTS TransferTransaction
 * @param ownerSignature: {TransactionSignature} The signature information for the NFT owner
 * @param receiverSignature: {TransactionSignature} The signature information for the NFT receiver
 * @param transactionBytes: {Uint8Array} The transaction bytes to be executed
 * @returns {Promise<number>}
 */
  transferDomain = async (
    ownerSignature: TransactionSignature,
    receiverSignature: TransactionSignature,
    transactionBytes: Uint8Array,
  ): Promise<number> => {
    try {
      const transaction: Transaction = HashgraphNames.bytesToTransaction(transactionBytes);
      transaction
        .addSignature(ownerSignature.signerPublicKey, ownerSignature.signature)
        .addSignature(receiverSignature.signerPublicKey, receiverSignature.signature);

      const submitTransaction = await transaction.execute(this.client);
      const receipt = await submitTransaction.getReceipt(this.client);
      if (receipt.status._code !== Status.Success._code) {
        throw new Error('TransferTransaction failed');
      }
    } catch (err) {
      throw new Error('Transfer Domain failed');
    }
    return CONFIRMATION_STATUS;
  };

  /**
 * @description Signs a Hedera transaction
 * @param signerKey: {string} The private key with which to sign the transaction
 * @param transactionBytes: {Uint8Array} The bytes for the transaction to be signed
 * @returns {Promise<Uint8Array>}
 */
  static transferTransactionSign = (signerKey: string, transactionBytes: Uint8Array): TransactionSignature => {
    const transaction: Transaction = HashgraphNames.bytesToTransaction(transactionBytes);
    const signerPVKey = PrivateKey.fromString(signerKey);
    const signature = signerPVKey.signTransaction(transaction);
    return { signerPublicKey: signerPVKey.publicKey, signature };
  };

  /**
 * @description Creates a HTS TransferTransaction and returns it as an Uint8Array
 * @param domain: {string} The domain for the NFT to transfer
 * @param NFTOwner: {string} The account id of the NFT owner
 * @param NFTReceiver: {string} The account id of the NFT receiver
 * @param purchasePrice: {number} The amount in tinyBar for which the NFT is being purchased
 * @returns {Uint8Array}
 */
  transferTransactionCreate = async (
    domain: string,
    NFTOwner: string,
    NFTReceiver: string,
    purchasePrice: number,
  ): Promise<Uint8Array> => {
    try {
      const fromIdNFT = AccountId.fromString(NFTOwner);
      const toIdNFT = AccountId.fromString(NFTReceiver);
      const nameHash = HashgraphNames.generateNameHash(domain);
      const sldNodeId: ContractId = await this.resolveSLDNode(nameHash);
      const serial: number = await callGetSerial(this.client, sldNodeId, nameHash);

      const nodeId = [new AccountId(3)];

      const tokenTransferTx = new TransferTransaction()
        .addNftTransfer(this.tokenId, serial, fromIdNFT, toIdNFT)
        .addHbarTransfer(toIdNFT, Hbar.fromTinybars(-1 * purchasePrice))
        .addHbarTransfer(fromIdNFT, Hbar.fromTinybars(purchasePrice))
        .setNodeAccountIds(nodeId)
        .freezeWith(this.client);

      return tokenTransferTx.toBytes();
    } catch (err) {
      throw new Error('MultiSig transaction create failed');
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
}

// ================================================

//   /**
//  * @description Gets the serial for the domain, then queries for the AccountId who owns
//  * that domain.
//  * @param domain: {string} The domain to query
//  * @returns {Promise<AccountId>}
//  */
//   getWallet = async (domain: string): Promise<AccountId> => {
//     try {
//       const { serial } = await this.getNFTSerialString(domain);
//       const { accountId } = await this.getTokenNFTInfo(Number(serial));
//       return accountId;
//     } catch (err) {
//       logger.error(err);
//       throw new Error('Failed to get wallet');
//     }
//   };

// ================================================

/**
//  * @description Simple wrapper around HTS TokenMintTransaction()
//  * @param metadata: {Buffer} The metadata to include on the newly minted NFT
//  * @returns {Promise<number>}
//  */
//   private mintNFT = async (
//     accountId: AccountId,
//     metadata: NFTMetadata,
//     domainHash: Buffer,
//   ): Promise<number> => {
//     try {
//       const managerInfo = getManagerInfo();

//       const params = [
//         `0x${accountId.toSolidityAddress().toString()}`,
//         JSON.stringify(metadata),
//         `0x${domainHash.toString('hex')}`,
//       ];

//       const mintTx = await callContractFunc(
//         managerInfo.contract.id,
//         managerInfo.abi,
//         'mintTo',
//         params,
//         this.client,
//       );
//       return mintTx[0];
//       // const mintTx = new TokenMintTransaction()
//       //   .setTokenId(this.tokenId)
//       //   .setMetadata([Buffer.from(JSON.stringify(metadata))])
//       //   .freezeWith(this.client);
//       // const mintTxSign = await mintTx.sign(this.supplyKey);
//       // const mintTxSubmit = await mintTxSign.execute(this.client);
//       // const mintRx = await mintTxSubmit.getReceipt(this.client);
//       // if (mintRx.status._code !== Status.Success._code) {
//       //   throw new Error('TokenMintTransaction failed');
//       // }
//       // return mintRx;
//     } catch (err) {
//       logger.error(err);
//       throw new Error('Failed to mint NFT');
//     }
//   };

// ================================================

//   /**
//  * @description Check if a token is associated with a specific account
//  * @param accountId: {AccountId} The account to check if the domain NFT is associated
//  * @returns {Promise<boolean>}
//  */
//    private isTokenAssociatedToAccount = async (
//     accountId: AccountId,
//   ): Promise<boolean> => {
//     try {
//       const balanceCheckTx = await new AccountBalanceQuery()
//         .setAccountId(accountId)
//         .execute(this.client);

//       if (!balanceCheckTx) {
//         throw new Error('AccountBalanceQuery Failed');
//       }

//       const { tokens } = balanceCheckTx;
//       if (tokens) {
//         const tokenOfInterest = tokens._map.get(this.tokenId.toString());
//         return tokenOfInterest !== undefined;
//       }

//       return false;
//     } catch (err) {
//       logger.error(err);
//       throw new Error('Failed to determine if token is associated to account');
//     }
//   };

//   /**
//  * @description Check if a domain exists in the registry
//  * @param domainHash: {Buffer} The hash of the domain to check
//  * @returns {Promise<boolean>}
//  */
//   private checkDomainExists = async (
//     domainHash: Buffer,
//   ): Promise<boolean> => {
//     try {
//       const { serial } = await this.getDomainSerial(domainHash);
//       return Number(serial) !== 0;
//     } catch (err) {
//       logger.error(err);
//       throw new Error('Failed to check if domains exists');
//     }
//   };

//   //   /**
//   //  * @description Register a domain in the smart contract Registry
//   //  * @param domainHash: {Buffer} The hash of the domain to add to the Registry
//   //  * @param serial: {number} The serial of the NFT to register
//   //  * @returns {Promise<number>}
//   //  */
//   //   private registerDomain = async (
//   //     domainHash: Buffer,
//   //     serial: number,
//   //   ): Promise<number> => {
//   //     try {
//   //     // Get manager contract from env
//   //       const managerInfo = getManagerInfo();

//   //       // Add if not present
//   //       await callContractFunc(
//   //         managerInfo.contract.id,
//   //         managerInfo.abi,
//   //         'addRecord',
//   //         [`0x${domainHash.toString('hex')}`, `${serial}`],
//   //         this.client,
//   //       );
//   //       return CONFIRMATION_STATUS;
//   //     } catch (err) {
//   //       logger.error(err);
//   //       throw new Error('Failed to register Domain');
//   //     }
//   //   };

//   /**
//  * @description Mints a new domain NFT and records it in the registry
//  * @throws {@link InternalServerError}
//  * @param domain {string} The domain to mint
//  * @param ownerId {string} The owner of the domain to mint
//  * @returns {Promise<number>}
//  */
//   mintDomain = async (
//     domain: string,
//     ownerId: string,
//   ): Promise<number> => {
//     let domainHash;

//     const accountId = AccountId.fromString(ownerId);

//     try {
//       domainHash = HashgraphNames.generateNFTHash(domain);

//       const domainExists = await this.checkDomainExists(domainHash);
//       if (domainExists) throw new Error('Domain already exists in the registry');

//       const isAssociated = await this.isTokenAssociatedToAccount(accountId);
//       if (!isAssociated) throw new Error('Wallet must first be associated before a token can be minted');

//       // Mint the NFT
//       const metadata = HashgraphNames.generateMetadata(domain);
//       const mintResponse = await this.mintNFT(accountId, metadata, domainHash);
//       if (Number(mintResponse) !== Number(Status.Success._code)) throw new Error('Failed to mint domain');

//       return CONFIRMATION_STATUS;
//     } catch (err) {
//       logger.error(err);
//       throw new Error('Failed to mint domain.');
//     }
//   };

// ================================================

/**
//  * @description Query the registry for the owner of a domain
//  * @param domainHash: {Buffer} The hash of the domain to query
//  * @returns {Promise<SerialInfo>}
//  */
//   private getDomainSerial = async (domainHash: Buffer): Promise<SerialInfo> => {
//     let decodedResult: SerialInfo = { serial: '0', node: '0' };
//     try {
//       const managerInfo = getManagerInfo();

//       const numNodes: number = (
//         await callContractFunc(
//           managerInfo.contract.id,
//           managerInfo.abi,
//           'getNumNodes',
//           [],
//           this.client,
//         )
//       )[0];

//       const chunkSize = 100;
//       let begin = 0;
//       let end = 0;
//       for (let i = 0; end < numNodes; i += 1) {
//         end = Number((i + 1) * chunkSize);
//         // eslint-disable-next-line no-await-in-loop
//         decodedResult = await this.callGetSerial(domainHash, begin, end);
//         if (Number(decodedResult.serial) !== Number(0)) {
//         // Found the owner
//           break;
//         }
//         begin = end;
//       }
//       return decodedResult;
//     } catch (err) {
//       logger.error(err);
//       throw new Error('Failed to get owner');
//     }
//   };

// ================================================

// /**
//  * @description Wrapper around getDomainSerial() that takes a string of the domain
//  * @param domain: {string} The domain to query
//  * @returns {Promise<SerialInfo>}
//  */
//    getNFTSerialString = async (domain: string): Promise<SerialInfo> => this.getDomainSerial(HashgraphNames.generateNFTHash(domain));

// ================================================

// ================================================

// ================================================

// ================================================

// ================================================

// ================================================

// ================================================

// ================================================
