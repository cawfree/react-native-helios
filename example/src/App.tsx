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
          const shutdowns = await Promise.all(
            ENVIRONMENTS.map((params) =>
              start(params).then(({ shutdown }) => shutdown)
            )
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const urls = ENVIRONMENTS.map(
            ({ rpc_port }) =>
              `http://${
                Platform.OS === 'android' ? 'localhost' : '127.0.0.1'
              }:${rpc_port}`
          );

          const providers = await Promise.all(
            urls.map((url) => ethers.providers.getDefaultProvider(url))
          );

          const blockNumbers = await Promise.all(
            providers.map((provider) => provider.getBlockNumber())
          );

          console.warn(
            blockNumbers.map((blockNumber) => blockNumber.toString())
          );

          await Promise.all(shutdowns.map((shutdown) => shutdown()));

          const didTerminates = await Promise.all(
            providers.map((provider) =>
              provider
                .getBlockNumber()
                .then(() => false)
                .catch(() => true)
            )
          );

          if (didTerminates.reduce((e, f) => e && f, true)) return;

          throw new Error('Failed to terminate.');
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
