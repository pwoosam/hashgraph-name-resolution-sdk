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
dotenv_1.default.config();
const opId = process.env.OPERATOR_ID;
const opKey = process.env.OPERATOR_PVKEY;
describe('test getSLDInfo function', () => {
    jest.setTimeout(1000 * 20);
    // As of now, this test requires there to be a domain by the name of "sld1.hbar" registered
    // and has its SLDInfo set with dummy data
    it('should be able to query SLDInfo for a domain', () => __awaiter(void 0, void 0, void 0, function* () {
        if (!opId || !opKey) {
            fail('This test requires data from the env file');
        }
        const h = new index_1.HashgraphNames(opId, opKey);
        const domain = 'sld1.hbar';
        const sldInfo = yield h.getSLDInfo(domain);
        expect(sldInfo.serial).toEqual('1');
        expect(sldInfo.textRecord.url).toEqual('url');
        expect(sldInfo.textRecord.avatar).toEqual('avatar');
        expect(sldInfo.textRecord.discord).toEqual('discord');
        expect(sldInfo.addresses.eth).toEqual('0x0000000000000000000000000000000000000005');
        expect(sldInfo.addresses.btc).toEqual('0x0000000000000000000000000000000000000008');
    }));
});
