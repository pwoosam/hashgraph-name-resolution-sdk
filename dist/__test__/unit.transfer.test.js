"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const constants_config_1 = require("../config/constants.config");
const index_1 = require("../index");
dotenv_1.default.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;
const aliceId = process.env.ALICE_ID;
const aliceKey = process.env.ALICE_PVKEY;
const bobId = process.env.BOB_ID;
const bobKey = process.env.BOB_PVKEY;
// As of now, this test requires there to be a domain by the name of "sld1.hbar" minted and owned by
// either the alice or bob test account.
describe('test transfer function', () => {
    jest.setTimeout(1000 * 40);
    it('should be able to transfer a domain to a new user', async () => {
        if (!opId || !opKey || !aliceId || !aliceKey || !bobId || !bobKey) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const domain = 'sld1.hbar';
        const currOwner = (await h.resolveSLD(domain)).toString();
        expect(currOwner).toEqual(expect.anything());
        expect([aliceId, bobId]).toContain(currOwner);
        let newOwner;
        let newOwnerKey;
        let currOwnerKey;
        if (currOwner === aliceId) {
            newOwner = bobId;
            newOwnerKey = bobKey;
            currOwnerKey = aliceKey;
        }
        else {
            newOwner = aliceId;
            newOwnerKey = aliceKey;
            currOwnerKey = bobKey;
        }
        const transferTransaction = await h.transferTransactionCreate(domain, currOwner, newOwner, 10);
        const currOwnerSig = index_1.HashgraphNames.transferTransactionSign(currOwnerKey, transferTransaction);
        const newOwnerSig = index_1.HashgraphNames.transferTransactionSign(newOwnerKey, transferTransaction);
        const result = await h.transferDomain(currOwnerSig, newOwnerSig, transferTransaction);
        expect(result).toEqual(constants_config_1.CONFIRMATION_STATUS);
        const actualNewOwner = await h.resolveSLD(domain);
        expect(actualNewOwner.toString()).toEqual(newOwner);
    });
});
