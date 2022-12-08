import * as React from 'react';

import { Image, StyleSheet, View, Platform } from 'react-native';
import { Network, start, StartParams } from 'react-native-helios';
import { ethers } from 'ethers';

const ENVIRONMENTS: readonly StartParams[] = [
  {
    network: Network.MAINNET,
    consensus_rpc_url: 'https://www.lightclientdata.org',
    untrusted_rpc_url:
      'https://eth-mainnet.g.alchemy.com/v2/pPwfAKdQqDr1OP-z5Txzmlk0YE1UvAQT',
    rpc_port: 8545,
  },
  {
    network: Network.GOERLI,
    consensus_rpc_url: 'http://testing.prater.beacon-api.nimbus.team',
    untrusted_rpc_url:
      'https://eth-goerli.g.alchemy.com/v2/LyCUMBtAaTf03kVgcjPvW22KkwuKigZY',
    rpc_port: 8546,
  },
];

export default function App() {
  React.useEffect(
    () =>
      void (async () => {
        try {
          const results = await Promise.all(ENVIRONMENTS.map(start));
          const shutdowns = results.map(({ shutdown }) => shutdown);
          const urls = ENVIRONMENTS.map(
            ({ rpc_port }) =>
              `http://${
                Platform.OS === 'android' ? 'localhost' : '127.0.0.1'
              }:${rpc_port}`
          );

          const [mainnet, goerli] = urls.map((url) =>
            ethers.providers.getDefaultProvider(url)
          );

          const [mainnetBlockNumber, goerliBlockNumber] = await Promise.all([
            mainnet!.getBlockNumber(),
            goerli!.getBlockNumber(),
          ]);

          console.warn(
            `Mainnet: #${mainnetBlockNumber.toString()}, Goerli: #${goerliBlockNumber.toString()}`
          );

          await Promise.all(shutdowns.map((shutdown) => shutdown()));

          mainnet!
            .getBlockNumber()
            .then(() => console.warn('failed mainnet'))
            .catch(() => console.warn('mainnet did fail successfully'));
          goerli!
            .getBlockNumber()
            .then(() => console.warn('failed goerli'))
            .catch(() => console.warn('goerli did fail successfully'));
        } catch (e) {
          console.error(e);
        }
      })(),
    []
  );

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://github.com/cawfree/web3-react-native/raw/master/public/logo.png',
        }}
        style={{ width: 100, height: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
});
