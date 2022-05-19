import { ContractId } from '@hashgraph/sdk';
export interface ManagerContract {
    id: ContractId;
    address: string;
}
export interface ManagerInfo {
    contract: ManagerContract;
    abi: string;
}
export declare const getManagerInfo: () => ManagerInfo;
