"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerInfo = void 0;
const sdk_1 = require("@hashgraph/sdk");
const constants_config_1 = require("./config/constants.config");
const getManagerInfo = () => {
    const managerId = sdk_1.ContractId.fromString(constants_config_1.MANAGER_ID);
    const abi = constants_config_1.MANAGER_ABI;
    const contract = {
        id: managerId,
        address: managerId.toSolidityAddress(),
    };
    return { contract, abi };
};
exports.getManagerInfo = getManagerInfo;
