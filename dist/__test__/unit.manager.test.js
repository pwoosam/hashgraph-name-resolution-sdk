"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = require("../manager");
const constants_config_1 = require("../config/constants.config");
describe('test', () => {
    test('should do something', () => {
        const output = (0, manager_1.getManagerInfo)();
        expect(output.contract.id.toString()).toEqual(constants_config_1.MANAGER_ID);
        expect(output.abi).toEqual(constants_config_1.MANAGER_ABI);
    });
});
