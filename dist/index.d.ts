import { AccountId, Client, PrivateKey, TokenId } from '@hashgraph/sdk';
export declare class HashgraphNames {
    text: string;
    operatorId: AccountId;
    operatorKey: PrivateKey;
    client: Client;
    tokenId: TokenId;
    constructor(text: string, operatorId: AccountId, operatorKey: PrivateKey);
    printMsg: () => void;
    printBalance: (accountId: AccountId) => Promise<{
        nft: number;
        hbar: number;
    }>;
}
