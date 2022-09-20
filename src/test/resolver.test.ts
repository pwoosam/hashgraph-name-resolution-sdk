import { Resolver } from "..";

test('.cream name resolves to an address', async () => {
  const resolver = new Resolver('hedera_main');
  await resolver.init();
  const result = await resolver.resolveSLD('0.cream');
  expect(result).toBeTruthy();
});

test('.hbar name resolves to an address', async () => {
  const resolver = new Resolver('hedera_main');
  await resolver.init();
  const result = await resolver.resolveSLD('0.hbar');
  expect(result).toBeTruthy();
});
