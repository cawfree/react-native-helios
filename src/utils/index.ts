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

export async function fallbackCheckpoint({
  network,
}: {
  readonly network: Network;
}): Promise<string> {
  return Helios.fallbackCheckpoint({ network });
}

const sanitizeRpc = (maybeRpcPort: number | undefined) => typeof maybeRpcPort === 'number' ? maybeRpcPort : 8545;

const sanitizeParams = async ({
  network: maybeNetwork,
  rpc_port: maybeRpcPort,
  checkpoint: maybeCheckpoint,
  ...extras
}: StartParams): Promise<StartParams> => {
  const network =
    typeof maybeNetwork === 'string' ? maybeNetwork : Network.MAINNET;

  const checkpoint =
    typeof maybeCheckpoint === 'string'
      ? maybeCheckpoint
      : await fallbackCheckpoint({ network });

  if (!checkpoint.startsWith('0x'))
    throw new Error(
      `Checkpoints must be prefixed with 0x. (Encountered "${checkpoint}").`
    );

  return {
    ...extras,
    network,
    rpc_port: sanitizeRpc(maybeRpcPort),
    checkpoint,
  };
};

export async function start(maybeParams: StartParams): Promise<StartResult> {
  const { rpc_port, ...extras } = await sanitizeParams(maybeParams);

  await Helios.start({ ...extras, rpc_port });

  const shutdown = async () => {
    await Helios.shutdown({ rpc_port });
  };

  return { shutdown };
}

export const getHeliosUri = ({
  rpc_port: maybeRpcPort,
}: Partial<Pick<StartParams, 'rpc_port'>>): string => {
  const rpc_port = sanitizeRpc(maybeRpcPort);
  return `http://${
    Platform.OS === 'android' ? 'localhost' : '127.0.0.1'
  }:${rpc_port}`;
};

export const getHeliosProvider = (params: Parameters<typeof getHeliosUri>[0]): Providers.Provider =>
  Providers.getDefaultProvider(getHeliosUri(params));
