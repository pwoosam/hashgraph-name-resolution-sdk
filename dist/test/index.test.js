"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
test('end to end behavior works', async () => {
    const resolver = new index_1.Resolver('hedera_test', '98966f0ee7024a18bedb460b568cc13f');
    await resolver.init();
    const result = await resolver.resolveSLD('palacios.hbar');
    console.log(result);
});
