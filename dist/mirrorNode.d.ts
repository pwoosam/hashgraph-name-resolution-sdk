import { MessageObject } from './types/MessageObject';
import { NFT } from './types/NFT';
export declare type NetworkType = 'hedera_test' | 'hedera_main' | 'lworks_test' | 'lworks_main' | 'arkhia_test' | 'arkhia_main';
export declare const TLD_TOPIC_ID = "0.0.47954429";
export declare enum NetworkBaseURL {
    'hedera_test' = "https://testnet.mirrornode.hedera.com/api/v1",
    'hedera_main' = "https://mainnet-public.mirrornode.hedera.com/api/v1",
    'lworks_test' = "https://testnet.mirror.lworks.io/api/v1",
    'lworks_main' = "https://mainnet.mirror.lworks.io/api/v1",
    'arkhia_test' = "https://hedera.testnet.arkhia.io/api/v1",
    'arkhia_main' = "https://hedera.mainnet.arkhia.io/api/v1"
}
export declare class MirrorNode {
    networkType: NetworkType;
    baseUrl: string;
    authKey: string;
    constructor(networkType: NetworkType, authKey?: string);
    getTopicMessages(topicId: string, offset: number): Promise<MessageObject[]>;
    getNFT(tokenId: string, serial: string): Promise<NFT>;
    private getBaseUrl;
    private sendGetRequest;
}
