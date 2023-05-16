export enum Network {
  MAINNET = 'MAINNET',
  GOERLI = 'GOERLI',
}

export type StartParams = {
  readonly network?: Network;
  readonly rpc_port?: number;
  readonly untrusted_rpc_url: string;
  readonly consensus_rpc_url: string;
  readonly checkpoint?: string;
};

export type StartResult = {
  readonly shutdown: () => Promise<void>;
};
