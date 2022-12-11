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

const sanitizeParams = ({
  network: maybeNetwork,
  rpc_port: maybeRpcPort,
  ...extras
}: StartParams): StartParams => {
  const network =
    typeof maybeNetwork === 'string' ? maybeNetwork : Network.MAINNET;
  const rpc_port = typeof maybeRpcPort === 'number' ? maybeRpcPort : 8545;
  return { ...extras, network, rpc_port };
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
