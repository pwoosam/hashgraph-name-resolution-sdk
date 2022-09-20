import { Resolver } from ".";

(async () => {
  const resolver = new Resolver('hedera_main');
  await resolver.init();
  const result = await resolver.resolveSLD('0.cream');
  console.log(result);
})();
