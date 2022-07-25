import { AccountId, ContractId, TokenId } from '@hashgraph/sdk';

export const CONFIRMATION_STATUS = 1;
export const EXIT_STATUS = -1;
export const HEDERA_SUCCESS = 22; // The transaction succeeded

export const TOKEN_ID = '0.0.47717582';
export const TLD_MANAGER_ID = '0.0.47717584';
export const TLD_MANAGER_ABI = '../src/contracts/abi/src_contracts_TLDManager_sol_TLDManager.abi';

export const TLD_NODE_ABI = '../src/contracts/abi/src_contracts_TLDNode_sol_TLDNode.abi';
export const SLD_NODE_ABI = '../src/contracts/abi/src_contracts_SLDNode_sol_SLDNode.abi';
export const SUBDOMAIN_NODE_ABI = '../src/contracts/abi/src_contracts_SubdomainNode_sol_SubdomainNode.abi';

export const MAX_GAS = 4000000;

type Network = 'testnet' | 'mainnet';
export const NETWORK: Network = 'testnet';
// export const NETWORK = 'mainnet';

export const NULL_CONTRACT_ADDRESS = ContractId.fromString('0.0.0').toSolidityAddress();
export const NULL_CONTRACT_ID = ContractId.fromString('0.0.0');
export const NULL_ACCOUNT_ID = AccountId.fromString('0.0.0');

export enum ContractTypes {
  SLDNode,
  TLDManager,
  TLDNode,
  SubdomainNode,
}
export type ContractType = ContractTypes.SLDNode | ContractTypes.SubdomainNode | ContractTypes.TLDManager | ContractTypes.TLDNode;

export interface ContractInfo {
  id: ContractId;
  abi: string;
}

export interface NameHash {
  domain: string;
  tldHash: Buffer;
  sldHash: Buffer;
  subdomainHash: Buffer;
}

// HIP-412 metadata not currently supported by hedera 100 byte metadata limit
export interface NFTMetadata {
  name: string;
  creator: string;
  // creatorDID: string;
  // description: string;
  // image: string;
  // type: string;
  // files: File[];
  // format: string;
  // properties: object[];
  // localization: object[];
}

export interface Addresses {
  eth: string;
  btc: string;
  sol: string;
}

export interface TextRecord {
  avatar: string;
  twitter: string;
  email: string;
  url: string;
  description: string;
  notice: string;
  keywords: string;
  discord: string;
  github: string;
  reddit: string;
  telegram: string;
}

export interface SLDInfo {
  serial: number,
  expiry: number,
  subdomainNode: string,
  index: number,
  addresses: Addresses,
  textRecord: TextRecord
}

export interface SubdomainInfo {
  owner: string,
  name: string,
  //   index: number,
  addresses: Addresses,
  textRecord: TextRecord
}

export interface NFTData {
  accountId: AccountId,
  metadata: string,
  serialNumber: number,
  tokenId: TokenId
}
