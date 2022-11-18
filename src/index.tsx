import { NativeModules, Platform } from 'react-native';

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

export type StartParams = {
  readonly untrusted_rpc_url: string;
  readonly consensus_rpc_url: string;
};

export function start(params: StartParams): Promise<void> {
  return Helios.start(params);
}

export function getBlockNumber(): Promise<string> {
  return Helios.getBlockNumber();
}
