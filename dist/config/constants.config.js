import { AccountId, ContractId } from '@hashgraph/sdk';
export const CONFIRMATION_STATUS = 1;
export const EXIT_STATUS = -1;
export const HEDERA_SUCCESS = 22; // The transaction succeeded
export const TOKEN_ID = '0.0.47717582';
export const TLD_MANAGER_ID = '0.0.47717584';
export const MAX_GAS = 4000000;
export const NETWORK = 'testnet';
// export const NETWORK = 'mainnet';
export const NULL_CONTRACT_ADDRESS = ContractId.fromString('0.0.0').toSolidityAddress();
export const NULL_CONTRACT_ID = ContractId.fromString('0.0.0');
export const NULL_ACCOUNT_ID = AccountId.fromString('0.0.0');
export var ContractTypes;
(function (ContractTypes) {
    ContractTypes[ContractTypes["SLDNode"] = 0] = "SLDNode";
    ContractTypes[ContractTypes["TLDManager"] = 1] = "TLDManager";
    ContractTypes[ContractTypes["TLDNode"] = 2] = "TLDNode";
    ContractTypes[ContractTypes["SubdomainNode"] = 3] = "SubdomainNode";
})(ContractTypes || (ContractTypes = {}));
