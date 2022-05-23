import { ContractId } from '@hashgraph/sdk';
import { MANAGER_ID, MANAGER_ABI } from './config/constants.config';

export interface ManagerContract {
  id: ContractId;
  address: string;
}

export interface ManagerInfo {
  contract: ManagerContract;
  abi: string;
}

export const getManagerInfo = (): ManagerInfo => {
  const managerId: ContractId = ContractId.fromString(MANAGER_ID);
  const abi: string = MANAGER_ABI;
  const contract: ManagerContract = {
    id: managerId,
    address: managerId.toSolidityAddress(),
  };
  return { contract, abi };
};
