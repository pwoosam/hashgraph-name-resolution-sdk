"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
test('Resolver works at all', async () => {
    const resolver = new index_1.Resolver('hedera_test');
    await resolver.init();
    const accountId = await resolver.resolveSLD('palacios.hbar');
    console.log(accountId);
});
