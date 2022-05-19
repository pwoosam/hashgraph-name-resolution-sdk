"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
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
_a = HashgraphNames;
HashgraphNames.printBalance = async () => {
    const opId = sdk_1.AccountId.fromString('0.0.18689954');
    const opKey = sdk_1.PrivateKey.fromString('302e020100300506032b6570042204205df941e9bfea39bd1acf0dab4abe73e82e4ef0f959f48bd342e538cc3bf08de5');
    const client = sdk_1.Client.forTestnet().setOperator(opId, opKey);
    const tokenId = sdk_1.TokenId.fromString('0.0.34832589');
    const balanceCheckTx = await new sdk_1.AccountBalanceQuery()
        .setAccountId(opId)
        .execute(client);
    if (!balanceCheckTx) {
        throw new Error('AccountBalanceQuery Failed');
    }
    let nftBalance = 0;
    if (balanceCheckTx.tokens) {
        nftBalance = Number(balanceCheckTx.tokens._map.get(tokenId.toString()));
    }
    return {
        nft: nftBalance,
        hbar: Number(balanceCheckTx.hbars.toTinybars()),
    };
};
