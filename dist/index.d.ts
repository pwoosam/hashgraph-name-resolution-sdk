import { AccountId, Client, PrivateKey, TokenId } from '@hashgraph/sdk';
interface SerialInfo {
    serial: string;
    node: string;
}
export declare class HashgraphNames {
    operatorId: AccountId;
    operatorKey: PrivateKey;
    client: Client;
    tokenId: TokenId;
    constructor(operatorId: AccountId, operatorKey: PrivateKey);
    printBalance: (accountId: AccountId) => Promise<{
        nft: number;
        hbar: number;
    }>;
    mintDomain: () => Promise<void>;
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
