import dotenv from 'dotenv';
import { SLDInfo } from '../config/constants.config';
import { HashgraphNames } from '../index';

dotenv.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;

describe('test getSLDInfo function', () => {
  jest.setTimeout(1000 * 20);

  // As of now, this test requires there to be a domain by the name of "sld1.hbar" registered
  // and has its SLDInfo set with dummy data
  it('should be able to query SLDInfo for a domain', async () => {
    if (!opId || !opKey) {
      fail('This test requires data from the env file');
    }
    const h = new HashgraphNames(opId, opKey);
    const domain = 'sld1.hbar';

    const sldInfo: SLDInfo = await h.getSLDInfo(domain);
    expect(sldInfo.serial).toEqual('1');
    expect(sldInfo.textRecord.url).toEqual('url');
    expect(sldInfo.textRecord.avatar).toEqual('avatar');
    expect(sldInfo.textRecord.discord).toEqual('discord');
    expect(sldInfo.addresses.eth).toEqual('0x0000000000000000000000000000000000000005');
    expect(sldInfo.addresses.btc).toEqual('0x0000000000000000000000000000000000000008');
  });
});
