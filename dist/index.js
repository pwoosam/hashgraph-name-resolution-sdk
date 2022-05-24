"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
const keccak256_1 = __importDefault(require("keccak256"));
const constants_config_1 = require("./config/constants.config");
const logger_config_1 = require("./config/logger.config");
const contract_utils_1 = require("./contract.utils");
const manager_1 = require("./manager");
class HashgraphNames {
    constructor(operatorId, operatorKey, supplyKey) {
        this.tokenId = sdk_1.TokenId.fromString(constants_config_1.TOKEN_ID);
        /**
       * @description Simple wrapper around HTS TokenMintTransaction()
       * @param metadata: {Buffer} The metadata to include on the newly minted NFT
       * @returns {Promise<TransactionReceipt>}
       */
        this.mintNFT = async (metadata) => {
            try {
                const mintTx = new sdk_1.TokenMintTransaction()
                    .setTokenId(this.tokenId)
                    .setMetadata([Buffer.from(JSON.stringify(metadata))])
                    .freezeWith(this.client);
                const mintTxSign = await mintTx.sign(this.supplyKey);
                const mintTxSubmit = await mintTxSign.execute(this.client);
                const mintRx = await mintTxSubmit.getReceipt(this.client);
                if (mintRx.status._code !== sdk_1.Status.Success._code) {
                    throw new Error('TokenMintTransaction failed');
                }
                return mintRx;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to mint NFT');
            }
        };
        /**
       * @description Check if a token is associated with a specific account
       * @param accountId: {AccountId} The account to check if the domain NFT is associated
       * @returns {Promise<boolean>}
       */
        this.isTokenAssociatedToAccount = async (accountId) => {
            try {
                const balanceCheckTx = await new sdk_1.AccountBalanceQuery()
                    .setAccountId(accountId)
                    .execute(this.client);
                if (!balanceCheckTx) {
                    throw new Error('AccountBalanceQuery Failed');
                }
                const { tokens } = balanceCheckTx;
                if (tokens) {
                    const tokenOfInterest = tokens._map.get(this.tokenId.toString());
                    return tokenOfInterest !== undefined;
                }
                return false;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to determine if token is associated to account');
            }
        };
        /**
       * @description Check if a domain exists in the registry
       * @param domainHash: {Buffer} The hash of the domain to check
       * @returns {Promise<boolean>}
       */
        this.checkDomainExists = async (domainHash) => {
            try {
                const { serial } = await this.getDomainSerial(domainHash);
                return Number(serial) !== 0;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to check if domains exists');
            }
        };
        /**
       * @description Register a domain in the smart contract Registry
       * @param domainHash: {Buffer} The hash of the domain to add to the Registry
       * @param serial: {number} The serial of the NFT to register
       * @returns {Promise<number>}
       */
        this.registerDomain = async (domainHash, serial) => {
            try {
                // Get manager contract from env
                const managerInfo = (0, manager_1.getManagerInfo)();
                // Add if not present
                await (0, contract_utils_1.callContractFunc)(managerInfo.contract.id, managerInfo.abi, 'addRecord', [`0x${domainHash.toString('hex')}`, `${serial}`], this.client);
                return constants_config_1.CONFIRMATION_STATUS;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to register Domain');
            }
        };
        /**
       * @description Mints a new domain NFT and records it in the registry
       * @throws {@link InternalServerError}
       * @param domain {string} The domain to mint
       * @param ownerId {string} The owner of the domain to mint
       * @returns {Promise<number>}
       */
        this.mintDomain = async (domain, ownerId) => {
            let NFTSerial;
            let domainHash;
            const accountId = sdk_1.AccountId.fromString(ownerId);
            try {
                domainHash = HashgraphNames.generateNFTHash(domain);
                const domainExists = await this.checkDomainExists(domainHash);
                if (domainExists)
                    throw new Error('Domain already exists in the registry');
                const isAssociated = await this.isTokenAssociatedToAccount(accountId);
                if (!isAssociated)
                    throw new Error('Wallet must first be associated before a token can be minted');
                // Mint the NFT
                const metadata = HashgraphNames.generateMetadata(domain);
                const mintRx = await this.mintNFT(metadata);
                NFTSerial = Number(mintRx.serials[0]);
                // Register the domain in the Registry
                await this.registerDomain(domainHash, NFTSerial);
                return constants_config_1.CONFIRMATION_STATUS;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to mint domain.');
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
                const { serial } = await this.getNFTSerialString(domain);
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
         * @description Simple wrapper around callContractFunc for the getSerial smart contract function
         * @param domainHash: {Buffer} The hash of the domain to query
         * @param begin: {number} The begin index in the array of nodes of the manager
         * @param end: {number} The end index in the array of nodes of the manager
         * @returns {Promise<SerialInfo>}
         */
        this.callGetSerial = async (domainHash, begin, end) => {
            try {
                const managerInfo = (0, manager_1.getManagerInfo)();
                const result = await (0, contract_utils_1.callContractFunc)(managerInfo.contract.id, managerInfo.abi, 'getSerial', [`0x${domainHash.toString('hex')}`, `${begin}`, `${end}`], this.client);
                return { serial: result[0], node: result[1] };
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to get owner');
            }
        };
        /**
       * @description Query the registry for the owner of a domain
       * @param domainHash: {Buffer} The hash of the domain to query
       * @returns {Promise<SerialInfo>}
       */
        this.getDomainSerial = async (domainHash) => {
            let decodedResult = { serial: '0', node: '0' };
            try {
                const managerInfo = (0, manager_1.getManagerInfo)();
                const numNodes = (await (0, contract_utils_1.callContractFunc)(managerInfo.contract.id, managerInfo.abi, 'getNumNodes', [], this.client))[0];
                const chunkSize = 100;
                let begin = 0;
                let end = 0;
                for (let i = 0; end < numNodes; i += 1) {
                    end = Number((i + 1) * chunkSize);
                    // eslint-disable-next-line no-await-in-loop
                    decodedResult = await this.callGetSerial(domainHash, begin, end);
                    if (Number(decodedResult.serial) !== Number(0)) {
                        // Found the owner
                        break;
                    }
                    begin = end;
                }
                return decodedResult;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to get owner');
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
                logger_config_1.logger.error(err);
                throw new Error('Get NFT info failed');
            }
        };
        /**
       * @description Wrapper around getDomainSerial() that takes a string of the domain
       * @param domain: {string} The domain to query
       * @returns {Promise<SerialInfo>}
       */
        this.getNFTSerialString = async (domain) => this.getDomainSerial(HashgraphNames.generateNFTHash(domain));
        /**
       * @description Gets the serial for the domain, then queries for the AccountId who owns
       * that domain.
       * @param domain: {string} The domain to query
       * @returns {Promise<AccountId>}
       */
        this.getWallet = async (domain) => {
            try {
                const { serial } = await this.getNFTSerialString(domain);
                const { accountId } = await this.getTokenNFTInfo(Number(serial));
                return accountId;
            }
            catch (err) {
                logger_config_1.logger.error(err);
                throw new Error('Failed to get wallet');
            }
        };
        this.operatorId = sdk_1.AccountId.fromString(operatorId);
        this.operatorKey = sdk_1.PrivateKey.fromString(operatorKey);
        this.supplyKey = sdk_1.PrivateKey.fromString(supplyKey);
        this.client = sdk_1.Client.forTestnet().setOperator(this.operatorId, this.operatorKey);
    }
}
exports.HashgraphNames = HashgraphNames;
HashgraphNames.generateMetadata = (domain) => {
    const metadata = {
        name: domain,
        creator: 'piefi labs',
        // creatorDID: '',
        description: 'Hashgraph Naming service domain',
        // image: '[cid or path to NFT\'s image]',
        // type: 'image/jpeg', // TODO: Change this to whatever file type we end up generating for the NFT images
        // files: [],
        // format: 'none',
        // properties: [],
        // localization: [],
    };
    return metadata;
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
/**
 * @description Generate a hash of the provided domain string
 * @param domain: {string} The domain string to hash
 * @returns {Buffer}
 */
HashgraphNames.generateNFTHash = (domain) => {
    const subDomains = domain.split('.').reverse();
    return subDomains.reduce((prev, curr) => (0, keccak256_1.default)(prev + curr), Buffer.from([0]));
};
