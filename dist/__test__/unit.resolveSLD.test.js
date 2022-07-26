"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    it('should be able to resolve the SLD to the owners wallet', () => __awaiter(void 0, void 0, void 0, function* () {
        if (!opId || !opKey || !aliceId) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const sld = 'sld2.hbar';
        const wallet = yield h.resolveSLD(sld);
        expect(wallet.toString()).toEqual(aliceId.toString());
    }));
    it('should not be able to resolve a domain that does not exists', () => __awaiter(void 0, void 0, void 0, function* () {
        if (!opId || !opKey || !aliceId) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const sld = (0, utils_test_1.generateRandDomain)(8);
        yield expect(() => __awaiter(void 0, void 0, void 0, function* () { yield h.resolveSLD(sld); })).rejects.toThrow('Failed to get wallet');
    }));
});
