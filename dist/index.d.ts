import { AccountId, Client, PrivateKey, TokenId } from '@hashgraph/sdk';
interface SerialInfo {
    serial: string;
    node: string;
}
export declare class HashgraphNames {
    operatorId: AccountId;
    operatorKey: PrivateKey;
    supplyKey: PrivateKey;
    client: Client;
    tokenId: TokenId;
    constructor(operatorId: AccountId, operatorKey: PrivateKey, supplyKey: PrivateKey);
    printBalance: (accountId: AccountId) => Promise<{
        nft: number;
        hbar: number;
    }>;
    /**
   * @description Simple wrapper around HTS TokenMintTransaction()
   * @param metadata: {Buffer} The metadata to include on the newly minted NFT
   * @returns {Promise<TransactionReceipt>}
   */
    private mintNFT;
    /**
   * @description Check if a token is associated with a specific account
   * @param accountId: {AccountId} The account to check if the domain NFT is associated
   * @returns {Promise<boolean>}
   */
    private isTokenAssociatedToAccount;
    /**
   * @description Check if a domain exists in the registry
   * @param domainHash: {Buffer} The hash of the domain to check
   * @returns {Promise<boolean>}
   */
    private checkDomainExists;
    /**
   * @description Register a domain in the smart contract Registry
   * @param domainHash: {Buffer} The hash of the domain to add to the Registry
   * @param serial: {number} The serial of the NFT to register
   * @returns {Promise<number>}
   */
    private registerDomain;
    /**
   * @description Mints a new domain NFT and records it in the registry
   * @throws {@link InternalServerError}
   * @param domain {string} The domain to mint
   * @param ownerId {string} The owner of the domain to mint
   * @returns {Promise<number>}
   */
    mintDomain: (domain: string, ownerId: string) => Promise<number>;
    transferDomain: () => Promise<void>;
    /**
     * @description Generate a hash of the provided domain string
     * @param domain: {string} The domain string to hash
     * @returns {Buffer}
     */
    static generateNFTHash: (domain: string) => Buffer;
    /**
     * @description Simple wrapper around callContractFunc for the getSerial smart contract function
     * @param domainHash: {Buffer} The hash of the domain to query
     * @param begin: {number} The begin index in the array of nodes of the manager
     * @param end: {number} The end index in the array of nodes of the manager
     * @returns {Promise<SerialInfo>}
     */
    private callGetSerial;
    /**
   * @description Query the registry for the owner of a domain
   * @param domainHash: {Buffer} The hash of the domain to query
   * @returns {Promise<SerialInfo>}
   */
    private getDomainSerial;
    /**
   * @description Simple wrapper around HTS TokenNftInfoQuery()
   * @param serial: {number} The serial of the NFT to query
   * @returns {Promise<TokenNftInfo>}
   */
    private getTokenNFTInfo;
    /**
   * @description Wrapper around getDomainSerial() that takes a string of the domain
   * @param domain: {string} The domain to query
   * @returns {Promise<SerialInfo>}
   */
    getNFTSerialString: (domain: string) => Promise<SerialInfo>;
    /**
   * @description Gets the serial for the domain, then queries for the AccountId who owns
   * that domain.
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
    getWallet: (domain: string) => Promise<AccountId>;
}
export {};
