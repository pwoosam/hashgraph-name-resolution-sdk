"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const constants_config_1 = require("../config/constants.config");
const index_1 = require("../index");
const utils_test_1 = require("./utils.test");
const logger_config_1 = require("../config/logger.config");
dotenv_1.default.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;
const aliceId = process.env.ALICE_ID;
describe('test mint function', () => {
    jest.setTimeout(1000 * 20);
    it('should be able to mint a new domain', async () => {
        if (!opId || !opKey || !aliceId) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const domain = (0, utils_test_1.generateRandDomain)(8);
        expect(await h.mintDomain(domain, aliceId)).toEqual(constants_config_1.CONFIRMATION_STATUS);
    });
    it('shouldn\'t be able to mint a domain that already exists', async () => {
        jest.spyOn(logger_config_1.logger, 'error').mockImplementation(jest.fn());
        if (!opId || !opKey || !aliceId) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const domain = (0, utils_test_1.generateRandDomain)(8);
        const result = await h.mintDomain(domain, aliceId);
        expect(result).toEqual(constants_config_1.CONFIRMATION_STATUS);
        await expect(async () => { await h.mintDomain(domain, aliceId); }).rejects.toThrow('Failed to mint domain.');
    });
});
