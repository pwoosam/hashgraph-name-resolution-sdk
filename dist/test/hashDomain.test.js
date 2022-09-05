"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hashDomain_1 = require("../hashDomain");
test('hashDomain returns correct domain string', () => {
    const domain = 'radio.hbar';
    const nameHash = (0, hashDomain_1.hashDomain)(domain);
    expect(nameHash.domain).toBe(domain);
});
