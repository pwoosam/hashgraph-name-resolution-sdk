/// <reference types="node" />
export declare const CONFIRMATION_STATUS = 1;
export declare const EXIT_STATUS = -1;
export declare const HEDERA_SUCCESS = 22;
export declare const MANAGER_TOPIC_ID = "0.0.47954429";
declare type Network = 'testnet' | 'mainnet';
export declare const NETWORK: Network;
export declare const BASE_TEST_URL = "https://testnet.mirrornode.hedera.com/api/v1";
export declare const BASE_MAIN_URL = "https://mainnet-public.mirrornode.hedera.com/api/v1";
export declare const API_MAX_LIMIT = 100;
export interface NameHash {
    domain: string;
    tldHash: Buffer;
    sldHash: Buffer;
}
export interface TLDTopicMessage {
    nameHash: {
        domain: string;
        tldHash: string;
        sldHash: string;
    };
    topicId: string;
    contractId: string;
    tokenId: string;
}
export interface SLDTopicMessage {
    transactionId: string;
    nameHash: {
        domain: string;
        tldHash: string;
        sldHash: string;
    };
    nftId: number;
    provider: string;
    providerData: {
        contractId: string;
    };
}
export {};
