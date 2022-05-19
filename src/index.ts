import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey,
  TokenId,
} from '@hashgraph/sdk';

export class HashgraphNames {
  text: string;
  operatorId: AccountId;
  operatorKey: PrivateKey;
  client: Client;
  tokenId: TokenId = TokenId.fromString('0.0.34832589');

  constructor(text: string, operatorId: AccountId, operatorKey: PrivateKey) {
    this.text = text;
    this.operatorId = operatorId;
    this.operatorKey = operatorKey;

    this.client = Client.forTestnet().setOperator(this.operatorId, this.operatorKey);
  }

  printMsg = () => {
    // eslint-disable-next-line no-console
    console.log(this.text);
  };

  printBalance = async (accountId: AccountId) => {
    const balanceCheckTx = await new AccountBalanceQuery()
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
}
