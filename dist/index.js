"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printBalance = exports.hash = exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
const keccak256_1 = __importDefault(require("keccak256"));
class HashgraphNames {
    constructor(text) {
        this.printMsg = () => {
            // eslint-disable-next-line no-console
            console.log(this.text);
        };
        this.text = text;
    }
}
exports.HashgraphNames = HashgraphNames;
const hash = (input) => (0, keccak256_1.default)(input);
exports.hash = hash;
const printBalance = () => {
    // eslint-disable-next-line no-console
    console.log('This is a test');
    const opId = sdk_1.AccountId.fromString('0.0.18689954');
    // eslint-disable-next-line no-console
    console.log(opId);
    // const opKey = PrivateKey
    // .fromString('302e020100300506032b6570042204205df941e9bfea39bd1acf0dab4abe73e82e4ef0f959f48bd342e538cc3bf08de5');
    // const client = Client.forTestnet().setOperator(opId, opKey);
    // const tokenId = TokenId.fromString('0.0.34832589');
    // // eslint-disable-next-line no-console
    // console.log(client);
    // // eslint-disable-next-line no-console
    // console.log(tokenId);
    //   const balanceCheckTx = await new AccountBalanceQuery()
    //     .setAccountId(opId)
    //     .execute(client);
    //   if (!balanceCheckTx) {
    //     throw new Error('AccountBalanceQuery Failed');
    //   }
    //   let nftBalance = 0;
    //   if (balanceCheckTx.tokens) {
    //     nftBalance = Number(balanceCheckTx.tokens._map.get(tokenId.toString()));
    //   }
    //   return {
    //     nft: nftBalance,
    //     hbar: Number(balanceCheckTx.hbars.toTinybars()),
    //   };
};
exports.printBalance = printBalance;
