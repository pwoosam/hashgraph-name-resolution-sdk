"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
class HashgraphNames {
    constructor(text, operatorId, operatorKey) {
        this.tokenId = sdk_1.TokenId.fromString('0.0.34832589');
        this.printMsg = () => {
            // eslint-disable-next-line no-console
            console.log(this.text);
        };
        this.printBalance = async (accountId) => {
            const balanceCheckTx = await new sdk_1.AccountBalanceQuery()
                .setAccountId(accountId)
                .execute(this.client);
            if (!balanceCheckTx) {
                throw new Error('AccountBalanceQuery Failed');
            }
            let nftBalance = 0;
            if (balanceCheckTx.tokens) {
                nftBalance = Number(balanceCheckTx.tokens._map.get(this.tokenId.toString()));
            }
            return {
                nft: nftBalance,
                hbar: Number(balanceCheckTx.hbars.toTinybars()),
            };
        };
        this.text = text;
        this.operatorId = operatorId;
        this.operatorKey = operatorKey;
        this.client = sdk_1.Client.forTestnet().setOperator(this.operatorId, this.operatorKey);
    }
}
exports.HashgraphNames = HashgraphNames;
