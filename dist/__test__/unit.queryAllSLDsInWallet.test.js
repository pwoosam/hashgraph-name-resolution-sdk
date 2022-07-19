"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = require("../index");
dotenv_1.default.config();
const opId = process.env.ALICE_ID;
const opKey = process.env.ALICE_PVKEY;
describe('test querySLDInfo function', () => {
    jest.setTimeout(1000 * 20);
    // As of now, this test requires there to be 1 or more domains registered
    // to alice's wallet
    it('should be able to query all domains registered to alice', async () => {
        if (!opId || !opKey) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const nfts = await h.getAllSLDsInWallet();
        expect(nfts.length).toBeGreaterThan(0);
    });
});
