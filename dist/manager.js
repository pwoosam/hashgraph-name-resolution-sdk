"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerInfo = void 0;
const sdk_1 = require("@hashgraph/sdk");
const MANAGER_ID = '0.0.34407866';
const MANAGER_ABI = '.\\src\\contracts\\abi\\src_contracts_hnsLL_sol_NodeManager.abi';
const getManagerInfo = () => {
    const managerId = sdk_1.ContractId.fromString(MANAGER_ID);
    const abi = MANAGER_ABI;
    const contract = {
        id: managerId,
        address: managerId.toSolidityAddress(),
    };
    return { contract, abi };
};
exports.getManagerInfo = getManagerInfo;
