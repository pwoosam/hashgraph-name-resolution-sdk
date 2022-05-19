import {
  //   AccountBalanceQuery,
  AccountId,
  // Client,
  // PrivateKey,
  // TokenId,
} from '@hashgraph/sdk';

export class HashgraphNames {
  text: string;
  constructor(text: string) {
    this.text = text;
  }

  printMsg = () => {
    // eslint-disable-next-line no-console
    console.log(this.text);
  };
}

export const printBalance = () => {
  const opId = AccountId.fromString('0.0.18689954');
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
