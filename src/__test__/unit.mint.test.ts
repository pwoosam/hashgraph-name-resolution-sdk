import dotenv from 'dotenv';
import { CONFIRMATION_STATUS } from '../config/constants.config';
import { HashgraphNames } from '../index';
import { generateRandDomain } from './utils.test';
import { logger } from '../config/logger.config';

dotenv.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;
const supplyKey = process.env.SUPPLY_PVKEY;
const aliceId = process.env.ALICE_ID;

describe('test mint function', () => {
  jest.setTimeout(1000 * 20);

  it('should be able to mint a new domain', async () => {
    if (!opId || !opKey || !supplyKey || !aliceId) {
      fail('This test requires data from the env file');
    }
    const h = new HashgraphNames(opId, opKey, supplyKey);
    const domain = generateRandDomain(8);

    expect(await h.mintDomain(domain, aliceId)).toEqual(CONFIRMATION_STATUS);
  });

  it('shouldn\'t be able to mint without a supply key', async () => {
    jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    if (!opId || !opKey || !aliceId) {
      fail('This test requires data from the env file');
    }
    const h = new HashgraphNames(opId, opKey);
    const domain = generateRandDomain(8);

    await expect(async () => { await h.mintDomain(domain, aliceId); }).rejects.toThrow('Failed to mint domain.');
  });

  it('shouldn\'t be able to mint a domain that already exists', async () => {
    jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    if (!opId || !opKey || !supplyKey || !aliceId) {
      fail('This test requires data from the env file');
    }
    const h = new HashgraphNames(opId, opKey, supplyKey);
    const domain = generateRandDomain(8);

    const result = await h.mintDomain(domain, aliceId);
    expect(result).toEqual(CONFIRMATION_STATUS);

    await expect(async () => { await h.mintDomain(domain, aliceId); }).rejects.toThrow('Failed to mint domain.');
  });
});
