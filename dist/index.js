"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
const keccak256_1 = __importDefault(require("keccak256"));
const constants_config_1 = require("./config/constants.config");
const contract_utils_1 = require("./contract.utils");
class HashgraphNames {
    constructor(operatorId, operatorKey) {
        this.tokenId = sdk_1.TokenId.fromString(constants_config_1.TOKEN_ID);
        /**
       * @description Query the registry for the SLDNode responsible for a domain
       * @param nameHash: {NameHash} The NameHash of the domain to query
       * @param tldNodeId: {ContractId} TLDNode contract id
       * @returns {Promise<ContractId>}
       */
        this.getSLDNode = async (nameHash, tldNodeId = constants_config_1.NULL_CONTRACT_ID) => {
            try {
                let decodedResult = constants_config_1.NULL_CONTRACT_ID;
                let tldId = tldNodeId;
                if (tldId === constants_config_1.NULL_CONTRACT_ID) {
                    tldId = await (0, contract_utils_1.callGetTLD)(this.client, nameHash.tldHash);
                }
                const numNodes = await (0, contract_utils_1.callGetNumNodes)(this.client, tldId);
                const chunkSize = 100;
                let begin = 0;
                let end = 0;
                for (let i = 0; end < numNodes; i += 1) {
                    end = Number((i + 1) * chunkSize);
                    // eslint-disable-next-line no-await-in-loop
                    decodedResult = await (0, contract_utils_1.callGetSLDNode)(this.client, nameHash, tldId, begin, end);
                    if (decodedResult !== constants_config_1.NULL_CONTRACT_ID) {
                        // Found the owner
                        break;
                    }
                    begin = end;
                }
                return decodedResult;
            }
            catch (err) {
                throw new Error('Failed to get SLDNode');
            }
        };
        /**
       * @description Takes a nameHash and returns the SLD that contains it
       * @param nameHash: {Buffer} The nameHash of the domain to be queried
       * @returns {Promise<ContractId>}
       */
        this.resolveSLDNode = async (nameHash) => {
            try {
                const tldNodeId = await (0, contract_utils_1.callGetTLD)(this.client, nameHash.tldHash);
                if (String(tldNodeId) === String(constants_config_1.NULL_CONTRACT_ID)) {
                    throw new Error('Failed to getTLDNode');
                }
                const sldNodeId = await this.getSLDNode(nameHash, tldNodeId);
                if (String(sldNodeId) === String(constants_config_1.NULL_CONTRACT_ID)) {
                    throw new Error('Failed to getSLDNode');
                }
                return sldNodeId;
            }
            catch (err) {
                throw new Error('Failed to resolve SLD');
            }
        };
        /**
       * @description Resolves a Second Level Domain to the wallet address of the domain's owner
       * @param domain: {string} The domain to query
       * @returns {Promise<AccountId>}
       */
        this.resolveSLD = async (domain) => {
            try {
                const nameHash = HashgraphNames.generateNameHash(domain);
                const sldNodeId = await this.resolveSLDNode(nameHash);
                const serial = await (0, contract_utils_1.callGetSerial)(this.client, sldNodeId, nameHash);
                const { accountId } = await this.getTokenNFTInfo(serial);
                return accountId;
            }
            catch (err) {
                throw new Error('Failed to get wallet');
            }
        };
        /**
       * @description Get the SLDInfo for a given domain
       * @param domain: {string} The domain to query
       * @returns {Promise<SLDInfo>}
       */
        this.getSLDInfo = async (domain) => {
            try {
                const nameHash = HashgraphNames.generateNameHash(domain);
                const sldNodeId = await this.resolveSLDNode(nameHash);
                return await (0, contract_utils_1.callGetSLDInfo)(this.client, sldNodeId, nameHash);
            }
            catch (err) {
                throw new Error('Failed to get SLD Info');
            }
        };
        /**
       * @description Get the SubdomainInfo for a given domain
       * @param domain: {string} The domain to query
       * @returns {Promise<SubdomainInfo>}
       */
        this.getSubdomainInfo = async (domain) => {
            try {
                const nameHash = HashgraphNames.generateNameHash(domain);
                const sldNodeId = await this.resolveSLDNode(nameHash);
                const sldNodeInfo = await (0, contract_utils_1.callGetSLDInfo)(this.client, sldNodeId, nameHash);
                const subdomainNodeId = sdk_1.ContractId.fromSolidityAddress(sldNodeInfo.subdomainNode);
                return await (0, contract_utils_1.callGetSubdomainInfo)(this.client, subdomainNodeId, nameHash);
            }
            catch (err) {
                throw new Error('Failed to get SLD Info');
            }
        };
        /**
       * @description Get all subdomains for a given domain
       * @param domain: {string} The domain to query
       * @returns {Promise<string[]>}
       */
        this.getSLDSubdomains = async (domain) => {
            try {
                const nameHash = HashgraphNames.generateNameHash(domain);
                const sldNodeId = await this.resolveSLDNode(nameHash);
                const sldNodeInfo = await (0, contract_utils_1.callGetSLDInfo)(this.client, sldNodeId, nameHash);
                const subdomainNodeId = sdk_1.ContractId.fromSolidityAddress(sldNodeInfo.subdomainNode);
                return await (0, contract_utils_1.callDumpNames)(this.client, subdomainNodeId);
            }
            catch (err) {
                throw new Error('Failed to get SLD Info');
            }
        };
        this.getAllSLDsInWallet = async () => {
            try {
                return await (0, contract_utils_1.queryNFTsFromRestAPI)(this.client, this.tokenId);
            }
            catch (err) {
                throw new Error('Failed to get SLD Info');
            }
        };
        /**
       * @description Executes an HTS TransferTransaction
       * @param ownerSignature: {TransactionSignature} The signature information for the NFT owner
       * @param receiverSignature: {TransactionSignature} The signature information for the NFT receiver
       * @param transactionBytes: {Uint8Array} The transaction bytes to be executed
       * @returns {Promise<number>}
       */
        this.transferDomain = async (ownerSignature, receiverSignature, transactionBytes) => {
            try {
                const transaction = HashgraphNames.bytesToTransaction(transactionBytes);
                transaction
                    .addSignature(ownerSignature.signerPublicKey, ownerSignature.signature)
                    .addSignature(receiverSignature.signerPublicKey, receiverSignature.signature);
                const submitTransaction = await transaction.execute(this.client);
                const receipt = await submitTransaction.getReceipt(this.client);
                if (receipt.status._code !== sdk_1.Status.Success._code) {
                    throw new Error('TransferTransaction failed');
                }
            }
            catch (err) {
                throw new Error('Transfer Domain failed');
            }
            return constants_config_1.CONFIRMATION_STATUS;
        };
        /**
       * @description Creates a HTS TransferTransaction and returns it as an Uint8Array
       * @param domain: {string} The domain for the NFT to transfer
       * @param NFTOwner: {string} The account id of the NFT owner
       * @param NFTReceiver: {string} The account id of the NFT receiver
       * @param purchasePrice: {number} The amount in tinyBar for which the NFT is being purchased
       * @returns {Uint8Array}
       */
        this.transferTransactionCreate = async (domain, NFTOwner, NFTReceiver, purchasePrice) => {
            try {
                const fromIdNFT = sdk_1.AccountId.fromString(NFTOwner);
                const toIdNFT = sdk_1.AccountId.fromString(NFTReceiver);
                const nameHash = HashgraphNames.generateNameHash(domain);
                const sldNodeId = await this.resolveSLDNode(nameHash);
                const serial = await (0, contract_utils_1.callGetSerial)(this.client, sldNodeId, nameHash);
                const nodeId = [new sdk_1.AccountId(3)];
                const tokenTransferTx = new sdk_1.TransferTransaction()
                    .addNftTransfer(this.tokenId, serial, fromIdNFT, toIdNFT)
                    .addHbarTransfer(toIdNFT, sdk_1.Hbar.fromTinybars(-1 * purchasePrice))
                    .addHbarTransfer(fromIdNFT, sdk_1.Hbar.fromTinybars(purchasePrice))
                    .setNodeAccountIds(nodeId)
                    .freezeWith(this.client);
                return tokenTransferTx.toBytes();
            }
            catch (err) {
                throw new Error('MultiSig transaction create failed');
            }
        };
        /**
       * @description Simple wrapper around HTS TokenNftInfoQuery()
       * @param serial: {number} The serial of the NFT to query
       * @returns {Promise<TokenNftInfo>}
       */
        this.getTokenNFTInfo = async (serial) => {
            try {
                const nftId = new sdk_1.NftId(this.tokenId, serial);
                const nftInfo = await new sdk_1.TokenNftInfoQuery()
                    .setNftId(nftId)
                    .execute(this.client);
                return nftInfo[0];
            }
            catch (err) {
                throw new Error('Get NFT info failed');
            }
        };
        this.operatorId = sdk_1.AccountId.fromString(operatorId);
        this.operatorKey = sdk_1.PrivateKey.fromString(operatorKey);
        this.client = sdk_1.Client
            .forTestnet()
            .setOperator(this.operatorId, this.operatorKey);
    }
}
exports.HashgraphNames = HashgraphNames;
HashgraphNames.generateMetadata = (domain) => {
    const metadata = {
        name: domain,
        creator: 'piefi labs',
        // creatorDID: '',
        // description: 'Hashgraph Naming service domain',
        // image: '[cid or path to NFT\'s image]',
        // type: 'image/jpeg',
        // files: [],
        // format: 'none',
        // properties: [],
        // localization: [],
    };
    return metadata;
};
/**
* @description Generate a NameHash of the provided domain string
* @param domain: {string} The domain string to hash
* @returns {Buffer}
*/
HashgraphNames.generateNameHash = (domain) => {
    if (!domain) {
        return {
            domain,
            tldHash: Buffer.from([0x0]),
            sldHash: Buffer.from([0x0]),
            subdomainHash: Buffer.from([0x0]),
        };
    }
    const domainsList = domain.split('.').reverse();
    const tld = domainsList[0];
    let sld;
    let subdomains;
    if (domainsList.length > 1) {
        sld = domainsList.slice(0, 2);
    }
    if (domainsList.length > 2) {
        subdomains = domainsList;
    }
    let tldHash = Buffer.from([0x0]);
    let sldHash = Buffer.from([0x0]);
    let subdomainHash = Buffer.from([0x0]);
    if (tld) {
        tldHash = (0, keccak256_1.default)(tld);
    }
    if (sld) {
        sldHash = sld.reduce((prev, curr) => (0, keccak256_1.default)(prev + curr), Buffer.from(''));
    }
    if (subdomains) {
        subdomainHash = subdomains.reduce((prev, curr) => (0, keccak256_1.default)(prev + curr), Buffer.from(''));
    }
    return { domain, tldHash, sldHash, subdomainHash };
};
/**
* @description Helper function to convert an Uint8Array into an Hedera Transaction type
* @param transactionBytes: {Uint8Array} The transaction bytes to be converted
*/
HashgraphNames.bytesToTransaction = (transactionBytes) => {
    const uint8Array = new Uint8Array(transactionBytes);
    const transaction = sdk_1.Transaction.fromBytes(uint8Array);
    return transaction;
};
/**
* @description Signs a Hedera transaction
* @param signerKey: {string} The private key with which to sign the transaction
* @param transactionBytes: {Uint8Array} The bytes for the transaction to be signed
* @returns {Promise<Uint8Array>}
*/
HashgraphNames.transferTransactionSign = (signerKey, transactionBytes) => {
    const transaction = HashgraphNames.bytesToTransaction(transactionBytes);
    const signerPVKey = sdk_1.PrivateKey.fromString(signerKey);
    const signature = signerPVKey.signTransaction(transaction);
    return { signerPublicKey: signerPVKey.publicKey, signature };
};
