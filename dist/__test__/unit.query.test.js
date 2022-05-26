"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const constants_config_1 = require("../config/constants.config");
const index_1 = require("../index");
const utils_test_1 = require("./utils.test");
dotenv_1.default.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;
const supplyKey = process.env.SUPPLY_PVKEY;
const aliceId = process.env.ALICE_ID;
const treasuryId = process.env.TREASURY_ID;
describe('test query function', () => {
    jest.setTimeout(1000 * 20);
    it('should be able to query for a domain', async () => {
        if (!opId || !opKey || !supplyKey || !aliceId || !treasuryId) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey, supplyKey);
        const domain = (0, utils_test_1.generateRandDomain)(8);
        expect(await h.mintDomain(domain, aliceId)).toEqual(constants_config_1.CONFIRMATION_STATUS);
        const wallet = await h.getWallet(domain);
        expect(wallet.toString()).toEqual(treasuryId);
    });
});
