import { hashDomain } from './hashDomain';
import { MirrorNode, NetworkType } from './mirrorNode';
import { MessageObject } from './types/MessageObject';
import MessagesResponse from './types/MessagesResponse';
import { NameHash } from './types/NameHash';
import { SecondLevelDomain } from './types/SecondLevelDomain';
import { TopLevelDomain } from './types/TopLevelDomain';

export const TEST_TLD_TOPIC_ID = '0.0.48097305';
export const MAIN_TLD_TOPIC_ID = '0.0.1234189';


export class Resolver {
  mirrorNode: MirrorNode;
  topLevelDomains: TopLevelDomain[] = [];

  constructor(networkType: NetworkType, authKey = '') {
    this.mirrorNode = new MirrorNode(networkType, authKey);
  }

  public async init() {
    const { topLevelDomains } = await this.getTopLevelDomains();
    if (topLevelDomains) {
      this.topLevelDomains = topLevelDomains;
    }
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
    if(this.mirrorNode.networkType.includes("test")) return TEST_TLD_TOPIC_ID;
    return MAIN_TLD_TOPIC_ID;
  }

  /**
   * @description Retrieves and stores top level domains
   */
  private async getTopLevelDomains(): Promise<MessagesResponse> {
    const response: MessagesResponse = await this.mirrorNode.getTopicMessages(
      this.getTldTopicId(),
      null,
    );

    response.topLevelDomains = response.messages.map((messageObject: MessageObject) => {
      const decoded = Buffer.from(messageObject.message, 'base64').toString();
      return JSON.parse(decoded) as TopLevelDomain;
    });

    return response;
  }

  /**
   * @description Get the tld message on the Manager topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<TLDTopicMessage>}
   */
  private getTopLevelDomain(nameHash: NameHash): TopLevelDomain {
    const found = this.topLevelDomains.find(
      (tld: TopLevelDomain) => tld.nameHash.tldHash === nameHash.tldHash.toString('hex'),
    );
    if (!found) throw new Error('TLD not found');

    return found;
  }

  /**
   * @description Retrieves second level domains
   */
  private async getSecondLevelDomains(
    topicId: string,
    next: string | null,
  ): Promise<MessagesResponse> {
    const response: MessagesResponse = await this.mirrorNode.getTopicMessages(
      topicId,
      next,
    );

    response.secondLevelDomains = response.messages.map((messageObject: MessageObject) => {
      const decoded = Buffer.from(messageObject.message, 'base64').toString();
      return JSON.parse(decoded) as SecondLevelDomain;
    });

    return response;
  }

  /**
   * @description Get the sld message on the TLD topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @param inputTopicId: {TopicId | null} The topic id to use for the query. If none is provided,
   * the manager topic will be queried first to get the topic for the namehash
   * @returns {Promise<SecondLevelDomain>}
   */

  // Improve method to look for unexpired domains
  private async getSecondLevelDomain(
    nameHash: NameHash,
  ): Promise<SecondLevelDomain> {
    const tld: TopLevelDomain = this.getTopLevelDomain(nameHash);

    let sld: SecondLevelDomain | undefined;
    let next: string | null = null;
    do {
      // eslint-disable-next-line no-await-in-loop
      const { secondLevelDomains, links }: MessagesResponse = await this.getSecondLevelDomains(tld.topicId, next);
      if (secondLevelDomains) {
        sld = secondLevelDomains.find(
          (item: SecondLevelDomain) => item.nameHash.sldHash === nameHash.sldHash.toString('hex'),
        );
        if (sld === undefined) {
          next = links.next;
        }
      } else {
        next = null;
      }
    } while (sld === undefined && next);

    if (sld) return sld;

    throw new Error(
      `SLD message for:[${
        nameHash.domain
      }] not found on topic:[${tld.topicId.toString()}]`,
    );
  }
}
