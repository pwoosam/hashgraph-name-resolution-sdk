import { domainCache } from './domainCache';
import { hashDomain } from './hashDomain';
import { MirrorNode, NetworkType } from './mirrorNode';
import { PollingTopicSubscriber } from './topicSubscriber/pollingTopicSubscriber';
import { NameHash } from './types/NameHash';
import { SecondLevelDomain } from './types/SecondLevelDomain';
import { TopLevelDomain } from './types/TopLevelDomain';

export const TEST_TLD_TOPIC_ID = '0.0.48097305';
export const MAIN_TLD_TOPIC_ID = '0.0.1234189';


export class Resolver {
  mirrorNode: MirrorNode;

  constructor(networkType: NetworkType, authKey = '') {
    this.mirrorNode = new MirrorNode(networkType, authKey);
  }

  public async init() {
    await this.getTopLevelDomains();
    for (const tld of Array.from(domainCache.tld.values())) {
      await this.getSecondLevelDomains(tld.tokenId);
    }
  }

  /**
   * @description Resolves a Second Level Domain to the wallet address of the domain's owner
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
  public async resolveSLD(domain: string): Promise<string> {
    const nameHash = hashDomain(domain);
    const sld = this.getSecondLevelDomain(nameHash);
    const [tokenId, serial] = sld.nftId.split(':');
    const nft = await this.mirrorNode.getNFT(tokenId, serial);
    return nft.account_id;
  }

  // Private

  private getTldTopicId(): string {
    if(this.mirrorNode.networkType.includes("test")) return TEST_TLD_TOPIC_ID;
    return MAIN_TLD_TOPIC_ID;
  }

  /**
   * @description Retrieves and stores top level domains
   */
  private async getTopLevelDomains(): Promise<void> {
    await new Promise<void>(resolve => {
      PollingTopicSubscriber.subscribe(
        this.mirrorNode.networkType,
        this.getTldTopicId(),
        messageObj => {
          const decoded = Buffer.from(messageObj.message, 'base64').toString();
          const tld = JSON.parse(decoded) as TopLevelDomain;

          // always set the cache to the latest tld on the topic
          domainCache.tld.set(tld.nameHash.tldHash, tld);
        },
        resolve,
        undefined,
        this.mirrorNode.authKey);
    });
  }

  /**
   * @description Get the tld message on the Manager topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<TLDTopicMessage>}
   */
  private getTopLevelDomain(nameHash: NameHash): TopLevelDomain {
    const tldHash = nameHash.tldHash.toString('hex');
    const found = domainCache.tld.has(tldHash);
    if (!found) throw new Error('TLD not found');

    return domainCache.tld.get(tldHash)!;
  }

  /**
   * @description Retrieves second level domains
   */
  private async getSecondLevelDomains(
    topicId: string,
  ): Promise<void> {
    await new Promise<void>(resolve => {
      PollingTopicSubscriber.subscribe(
        this.mirrorNode.networkType,
        topicId,
        messageObj => {
          const decoded = Buffer.from(messageObj.message, 'base64').toString();
          const sld = JSON.parse(decoded) as SecondLevelDomain;

          const tldHash = sld.nameHash.tldHash;
          const sldHash = sld.nameHash.sldHash;
          if (!domainCache.slds.has(tldHash)) {
            const sldDomainCaches = domainCache.slds.get(tldHash)!;
            if (sldDomainCaches.has(sldHash)) {
              const sldDomainCache = domainCache.slds.get(sldHash)!;

              // TODO: replace if the one in cache is expired
              if (!sldDomainCache.has(sldHash)) {
                sldDomainCache.set(sldHash, sld);
              }
            } else {
              domainCache.slds.set(sldHash, new Map([
                [sldHash, sld]
              ]));
            }
          }
        },
        resolve,
        undefined,
        this.mirrorNode.authKey);
    });
  }

  /**
   * @description Get the sld message on the TLD topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @param inputTopicId: {TopicId | null} The topic id to use for the query. If none is provided,
   * the manager topic will be queried first to get the topic for the namehash
   * @returns {Promise<SecondLevelDomain>}
   */

  // Improve method to look for unexpired domains
  private getSecondLevelDomain(
    nameHash: NameHash,
  ): SecondLevelDomain {
    const tld = this.getTopLevelDomain(nameHash);
    const tldHash = nameHash.tldHash.toString('hex');
    const sldHash = nameHash.sldHash.toString('hex');

    if (domainCache.slds.has(tldHash)) {
      const sldCacheForTld = domainCache.slds.get(tldHash)!;
      if (sldCacheForTld.has(sldHash)) {
        return sldCacheForTld.get(sldHash)!;
      }
    }

    throw new Error(
      `SLD message for:[${
        nameHash.domain
      }] not found on topic:[${tld.topicId.toString()}]`,
    );
  }
}
