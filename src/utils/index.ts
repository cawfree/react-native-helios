import { NativeModules, Platform } from 'react-native';
import * as Providers from '@ethersproject/providers';

import { StartParams, StartResult, Network } from '../@types';

const LINKING_ERROR =
  `The package 'react-native-helios' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const Helios = NativeModules.Helios
  ? NativeModules.Helios
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export const DEFAULT_CHECKPOINTS: {readonly [key in Network]: string} = {
  [Network.MAINNET]: '0x85e6151a246e8fdba36db27a0c7678a575346272fe978c9281e13a8b26cdfa68',
  [Network.GOERLI]: '0xb5c375696913865d7c0e166d87bc7c772b6210dc9edf149f4c7ddc6da0dd4495',
};

const sanitizeParams = ({
  network: maybeNetwork,
  rpc_port: maybeRpcPort,
  checkpoint: maybeCheckpoint,
  ...extras
}: StartParams): StartParams => {
  const network =
    typeof maybeNetwork === 'string' ? maybeNetwork : Network.MAINNET;
  const rpc_port = typeof maybeRpcPort === 'number' ? maybeRpcPort : 8545;

  const checkpoint = typeof maybeCheckpoint === 'string'
    ? maybeCheckpoint
    : DEFAULT_CHECKPOINTS[network];

  if (!checkpoint.startsWith('0x')) 
    throw new Error(`Checkpoints must be prefixed with 0x. (Encountered "${checkpoint}").`);
    
  return { ...extras, network, rpc_port, checkpoint };
};

export async function start(maybeParams: StartParams): Promise<StartResult> {
  const { rpc_port, ...extras } = sanitizeParams(maybeParams);

  await Helios.start({ ...extras, rpc_port });

  const shutdown = async () => {
    await Helios.shutdown({ rpc_port });
  };

  return { shutdown };
}

export const getHeliosUri = (maybeParams: StartParams): string => {
  const { rpc_port } = sanitizeParams(maybeParams);
  return `http://${
    Platform.OS === 'android' ? 'localhost' : '127.0.0.1'
  }:${rpc_port}`;
};

export const getHeliosProvider = (params: StartParams): Providers.Provider =>
  Providers.getDefaultProvider(getHeliosUri(params));
