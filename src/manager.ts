import { ContractId } from '@hashgraph/sdk';

const MANAGER_ID = '0.0.34853598';
// const MANAGER_ABI = 'node_modules\\@piefi-platform\\hashgraph-names-sdk\\src\\contracts\\abi\\src_contracts_nsNodes_sol_NSNodeManager.abi';
const MANAGER_ABI = '..\\src\\contracts\\abi\\src_contracts_nsNodes_sol_NSNodeManager.abi';

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
