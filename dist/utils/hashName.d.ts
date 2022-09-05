/// <reference types="node" />
/**
* @description Generate a NameHash of the provided domain
* @param domain: {string} The domain string to hash
* @returns {Buffer}
 */
declare const hashName: (domain: string) => {
    domain: any;
    tldHash: Buffer;
    sldHash: Buffer;
} | {
    domain: string;
    tldHash: any;
    sldHash: any;
};
export { hashName };
