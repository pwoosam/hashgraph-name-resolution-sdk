import { AccountId, Client, PrivateKey, TokenId } from '@hashgraph/sdk';
interface OwnerInfo {
    address: string;
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
     * @description Simple wrapper around callContractFunc for the getSerial smart contract function
     * @param domainHash: {Buffer} The hash of the domain to query
     * @param begin: {number} The begin index in the array of nodes of the manager
     * @param end: {number} The end index in the array of nodes of the manager
     * @returns {Promise<OwnerInfo>}
     */
    getSerial: (domainHash: Buffer, begin: number, end: number) => Promise<OwnerInfo>;
}
export {};
