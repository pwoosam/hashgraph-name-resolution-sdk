"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
(async () => {
    const resolver = new _1.Resolver('hedera_main');
    await resolver.init();
    const result = await resolver.resolveSLD('0.cream');
    console.log(result);
})();
