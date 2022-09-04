import { MirrorNode, NetworkType } from './mirrorNode';
import { hashDomain } from './hashDomain';
import { TopLevelDomain } from './types/TopLevelDomain';
import { SecondLevelDomain } from './types/SecondLevelDomain';
import { MessageObject } from './types/MessageObject';
import { NameHash } from './types/NameHash';

const tldTopicId = '0.0.48097305';

export class Resolver {
  mirrorNode: MirrorNode;
  topLevelDomains: TopLevelDomain[] = [];

  constructor(networkType: NetworkType, authKey = '') {
    this.mirrorNode = new MirrorNode(networkType, authKey);
  }

  public async init() {
    this.topLevelDomains = await this.getTopLevelDomains();
  }

  /**
 * @description Resolves a Second Level Domain to the wallet address of the domain's owner
 * @param domain: {string} The domain to query
 * @returns {Promise<AccountId>}
 */
  public async resolveSLD(domain: string): Promise<string> {
    try {
      const nameHash = hashDomain(domain);
      const sld = await this.getSecondLevelDomain(nameHash);
      const [tokenId, serial] = sld.nftId.split(':');
      const nft = await this.mirrorNode.getNFT(tokenId, serial);
      return nft.account_id;
    } catch (err) {
      throw err;
    }
  };

  // Private

  /**
 * @description Retrieves and stores top level domains
 */
  private async getTopLevelDomains(): Promise<TopLevelDomain[]> {
    const response = await this.mirrorNode.getTopicMessages(tldTopicId, 0);
    const messages: MessageObject[] = response;

    return messages.map((messageObject: MessageObject) => {
      const decoded = Buffer.from(messageObject.message, 'base64').toString();
      return JSON.parse(decoded) as TopLevelDomain;
    });
  }

  /**
   * @description Get the tld message on the Manager topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<TLDTopicMessage>}
   */
  private getTopLevelDomain(nameHash: NameHash): TopLevelDomain {
    const found = this.topLevelDomains.find((tld: TopLevelDomain) => (
      tld.nameHash.tldHash === nameHash.tldHash.toString('hex')
    ));
    if (!found) throw new Error('TLD not found');

    return found;
  }

  /**
 * @description Retrieves second level domains
 */
  private async getSecondLevelDomains(topicId: string, offset: number): Promise<SecondLevelDomain[]> {
    const response = await this.mirrorNode.getTopicMessages(topicId, offset);
    const messages: MessageObject[] = response;

    return messages.map((messageObject: MessageObject) => {
      const decoded = Buffer.from(messageObject.message, 'base64').toString();
      return JSON.parse(decoded) as SecondLevelDomain;
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
  private async getSecondLevelDomain(nameHash: NameHash): Promise<SecondLevelDomain> {
    const tld: TopLevelDomain = this.getTopLevelDomain(nameHash);

    for(let offset = 0; ; offset++) {
      const slds: SecondLevelDomain[] = await this.getSecondLevelDomains(tld.topicId, offset);
      const sld = slds.find((sld: SecondLevelDomain) => sld.nameHash.sldHash === nameHash.sldHash.toString('hex'));
      if(sld) return sld;
    }

    throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${tld.topicId.toString()}]`);
  }
}
