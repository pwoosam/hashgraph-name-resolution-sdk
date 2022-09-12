import { MirrorNode, NetworkType } from './mirrorNode';
import { TopLevelDomain } from './types/TopLevelDomain';
export declare const TEST_TLD_TOPIC_ID = "0.0.48097305";
export declare const MAIN_TLD_TOPIC_ID = "0.0.1234189";
export declare class Resolver {
    mirrorNode: MirrorNode;
    topLevelDomains: TopLevelDomain[];
    constructor(networkType: NetworkType, authKey?: string);
    init(): Promise<void>;
    /**
     * @description Resolves a Second Level Domain to the wallet address of the domain's owner
     * @param domain: {string} The domain to query
     * @returns {Promise<AccountId>}
     */
    resolveSLD(domain: string): Promise<string>;
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
     * @param inputTopicId: {TopicId | null} The topic id to use for the query. If none is provided,
     * the manager topic will be queried first to get the topic for the namehash
     * @returns {Promise<SecondLevelDomain>}
     */
    private getSecondLevelDomain;
}
