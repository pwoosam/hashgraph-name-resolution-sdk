import dotenv from 'dotenv';
import { HashgraphNames } from '../index';
import { logger } from '../config/logger.config';
import { generateRandDomain } from './utils.test';

dotenv.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;
const aliceId = process.env.ALICE_ID;

describe('test resolveSLD function', () => {
  jest.setTimeout(1000 * 20);

  // As of now, this test requires there to be a domain by the name of "sld1.hbar" minted and owned by alice
  it('should be able to resolve the SLD to the owners wallet', async () => {
    if (!opId || !opKey || !aliceId) {
      fail('This test requires data from the env file');
    }
    const h = new HashgraphNames(opId, opKey);
    const sld = 'sld2.hbar';
    const wallet = await h.resolveSLD(sld);
    expect(wallet.toString()).toEqual(aliceId.toString());
  });

  it('should not be able to resolve a domain that does not exists', async () => {
    jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    if (!opId || !opKey || !aliceId) {
      fail('This test requires data from the env file');
    }
    const h = new HashgraphNames(opId, opKey);
    const sld = generateRandDomain(8);

    await expect(async () => { await h.resolveSLD(sld); }).rejects.toThrow('Failed to get wallet');
  });
});
