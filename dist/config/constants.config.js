"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NULL_ACCOUNT_ID = exports.NULL_CONTRACT_ID = exports.NULL_CONTRACT_ADDRESS = exports.MAX_GAS = exports.SUBDOMAIN_NODE_ABI = exports.SLD_NODE_ABI = exports.TLD_NODE_ABI = exports.TLD_MANAGER_ABI = exports.TLD_MANAGER_ID = exports.TOKEN_ID = exports.HEDERA_SUCCESS = exports.EXIT_STATUS = exports.CONFIRMATION_STATUS = void 0;
const sdk_1 = require("@hashgraph/sdk");
exports.CONFIRMATION_STATUS = 1;
exports.EXIT_STATUS = -1;
exports.HEDERA_SUCCESS = 22; // The transaction succeeded
exports.TOKEN_ID = '0.0.47710511';
exports.TLD_MANAGER_ID = '0.0.47710513';
exports.TLD_MANAGER_ABI = '../src/contracts/abi/src_contracts_TLDManager_sol_TLDManager.abi';
exports.TLD_NODE_ABI = '../src/contracts/abi/src_contracts_TLDNode_sol_TLDNode.abi';
exports.SLD_NODE_ABI = '../src/contracts/abi/src_contracts_SLDNode_sol_SLDNode.abi';
exports.SUBDOMAIN_NODE_ABI = '../src/contracts/abi/src_contracts_SubdomainNode_sol_SubdomainNode.abi';
exports.MAX_GAS = 4000000;
exports.NULL_CONTRACT_ADDRESS = sdk_1.ContractId.fromString('0.0.0').toSolidityAddress();
exports.NULL_CONTRACT_ID = sdk_1.ContractId.fromString('0.0.0');
exports.NULL_ACCOUNT_ID = sdk_1.AccountId.fromString('0.0.0');
