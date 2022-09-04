"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashName = void 0;
/**
* @description Generate a NameHash of the provided domain
* @param domain: {string} The domain string to hash
* @returns {Buffer}
 */
const hashName = (domain) => {
    const resultDomain = emptyName(domain);
    if (!domain)
        return resultDomain;
    const domainsList = domain.split('.').reverse();
    const tld = domainsList[0];
    let sld;
    if (domainsList.length > 1)
        sld = domainsList.slice(0, 2);
    if (tld)
        tldHash = keccak256(tld);
    if (sld)
        sld = hashSLD(sld);
    console.log(typeof (sld));
    return { domain, tldHash, sldHash };
};
exports.hashName = hashName;
const emptyBuffer = () => {
    return Buffer.from([0x0]);
};
const emptyName = (domain) => {
    return {
        domain,
        tldHash: emptyBuffer(),
        sldHash: emptyBuffer(),
    };
};
const hashSLD = (sld) => {
    return sld.reduce((prev, curr) => keccak256(prev + curr), Buffer.from(''));
};
