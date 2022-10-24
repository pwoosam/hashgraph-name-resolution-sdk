import { MirrorNode, NetworkType } from "./mirrorNode";
import { ICache } from "./types/Cache";
import { NameHash } from "./types/NameHash";
import { SecondLevelDomain } from "./types/SecondLevelDomain";
export declare const TEST_TLD_TOPIC_ID = "0.0.48097305";
export declare const MAIN_TLD_TOPIC_ID = "0.0.1234189";
export { ICache, Links, MessageObject, MessagesResponse, NFT, NFTsResponse, NameHash, SecondLevelDomain, TopLevelDomain, } from "./types";
export declare class Resolver {
    mirrorNode: MirrorNode;
    private _isCaughtUpWithTopic;
    private _subscriptions;
    private cache;
    isCaughtUpPromise: Promise<unknown>;
    constructor(networkType: NetworkType, authKey?: string, cache?: ICache);
    /**
     * @description Initializes all topic subscriptions.
     */
    init(): void;
    dispose(): Promise<void>;
    /**
     * @description Resolves a Second Level Domain to the wallet address of the domain's owner
     * @param domain: {string} The domain to query
     * @returns {Promise<AccountId>}
     */
    resolveSLD(domain: string): Promise<string | undefined>;
    getAllDomainsForAccount(accountIdOrDomain: string): Promise<string[]>;
    private getTldTopicId;
    /**
     * @description Retrieves and stores top level domains
     */
    private getTopLevelDomains;
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    private getTopLevelDomain;
    /**
     * @description Retrieves second level domains
     */
    private getSecondLevelDomains;
    /**
     * @description Get the sld message on the TLD topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<SecondLevelDomain>}
     */
    getSecondLevelDomain(nameHash: NameHash): Promise<SecondLevelDomain | undefined>;
}
