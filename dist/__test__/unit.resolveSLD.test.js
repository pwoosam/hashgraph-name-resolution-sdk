"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = require("../index");
const utils_test_1 = require("./utils.test");
dotenv_1.default.config();
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
        const h = new index_1.HashgraphNames(opId, opKey);
        const sld = 'sld2.hbar';
        const wallet = await h.resolveSLD(sld);
        expect(wallet.toString()).toEqual(aliceId.toString());
    });
    it('should not be able to resolve a domain that does not exists', async () => {
        if (!opId || !opKey || !aliceId) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const sld = (0, utils_test_1.generateRandDomain)(8);
        await expect(async () => { await h.resolveSLD(sld); }).rejects.toThrow('Failed to get wallet');
    });
});
