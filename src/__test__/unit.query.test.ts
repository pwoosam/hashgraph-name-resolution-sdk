import dotenv from 'dotenv';
import { CONFIRMATION_STATUS } from '../config/constants.config';
import { HashgraphNames } from '../index';
import { generateRandDomain } from './utils.test';

dotenv.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;
const aliceId = process.env.ALICE_ID;
const treasuryId = process.env.TREASURY_ID;

describe('test query function', () => {
  jest.setTimeout(1000 * 20);

  it('should be able to query for a domain', async () => {
    if (!opId || !opKey || !aliceId || !treasuryId) {
      fail('This test requires data from the env file');
    }
    const h = new HashgraphNames(opId, opKey);
    const domain = generateRandDomain(8);

    expect(await h.mintDomain(domain, aliceId)).toEqual(CONFIRMATION_STATUS);

    const wallet = await h.getWallet(domain);
    expect(wallet.toString()).toEqual(aliceId);
  });
});
