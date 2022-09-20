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

  private _isCaughtUpWithTopic = new Map<string, boolean>();
  private _subscriptions: (() => void)[] = [];

  constructor(networkType: NetworkType, authKey = '') {
    this.mirrorNode = new MirrorNode(networkType, authKey);
  }

  /**
   * @description Initializes all topic subscriptions.
   */
  public init() {
    this.getTopLevelDomains().then(() => {
      const knownTlds = Array.from(domainCache.tld.values());
      knownTlds.forEach(tld => {
        this.getSecondLevelDomains(tld.topicId);
      })
    });
  }

  public async dispose() {
    await Promise.all(this._subscriptions.map(unsub => unsub()));
  }

  /**
   * @description Resolves a Second Level Domain to the wallet address of the domain's owner
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
  public async resolveSLD(domain: string): Promise<string> {
    const nameHash = hashDomain(domain);
    const sld = await this.getSecondLevelDomain(nameHash);
    const [tokenId, serial] = sld.nftId.split(':');
    const nft = await this.mirrorNode.getNFT(tokenId, serial);
    return nft.account_id;
  }

  // Private

  private getTldTopicId(): string {
    if (this.mirrorNode.networkType.includes("test")) return TEST_TLD_TOPIC_ID;
    return MAIN_TLD_TOPIC_ID;
  }

  /**
   * @description Retrieves and stores top level domains
   */
  private async getTopLevelDomains(): Promise<void> {
    await new Promise<void>(resolve => {
      this._subscriptions.push(PollingTopicSubscriber.subscribe(
        this.mirrorNode.networkType,
        this.getTldTopicId(),
        messageObj => {
          const decoded = Buffer.from(messageObj.message, 'base64').toString();
          const tld = JSON.parse(decoded) as TopLevelDomain;

          // always set the cache to the latest tld on the topic
          domainCache.tld.set(tld.nameHash.tldHash, tld);
        },
        () => {
          this._isCaughtUpWithTopic.set(this.getTldTopicId(), true);
          resolve()
        },
        undefined,
        this.mirrorNode.authKey));
    });
  }

  /**
   * @description Get the tld message on the Manager topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<TLDTopicMessage>}
   */
  private async getTopLevelDomain(nameHash: NameHash): Promise<TopLevelDomain> {
    while (!this._isCaughtUpWithTopic.get(this.getTldTopicId())) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }

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
      this._subscriptions.push(PollingTopicSubscriber.subscribe(
        this.mirrorNode.networkType,
        topicId,
        messageObj => {
          const decoded = Buffer.from(messageObj.message, 'base64').toString();
          const sld = JSON.parse(decoded) as SecondLevelDomain;

          const tldHash = sld.nameHash.tldHash;
          const sldHash = sld.nameHash.sldHash;
          if (domainCache.slds.has(tldHash)) {
            const sldDomainCache = domainCache.slds.get(tldHash)!;

            // TODO: replace if the one in cache is expired
            if (!sldDomainCache.has(sldHash)) {
              sldDomainCache.set(sldHash, sld);
            }
          } else {
            domainCache.slds.set(tldHash, new Map([
              [sldHash, sld]
            ]));
          }
        },
        () => {
          this._isCaughtUpWithTopic.set(topicId, true);
          resolve()
        },
        undefined,
        this.mirrorNode.authKey));
    });
  }

  /**
   * @description Get the sld message on the TLD topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<SecondLevelDomain>}
   */

  // Improve method to look for unexpired domains
  private async getSecondLevelDomain(
    nameHash: NameHash,
  ): Promise<SecondLevelDomain> {
    const tld = await this.getTopLevelDomain(nameHash);
    const tldHash = nameHash.tldHash.toString('hex');
    const sldHash = nameHash.sldHash.toString('hex');

    let isCaughtUp = false;
    while (!isCaughtUp) {
      isCaughtUp = this._isCaughtUpWithTopic.get(tld.topicId)!;
      if (domainCache.slds.has(tldHash)) {
        const sldCacheForTld = domainCache.slds.get(tldHash)!;
        if (sldCacheForTld.has(sldHash)) {
          return sldCacheForTld.get(sldHash)!;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 250));
    }

    throw new Error(
      `SLD message for:[${nameHash.domain
      }] not found on topic:[${tld.topicId.toString()}]`,
    );
  }
}
