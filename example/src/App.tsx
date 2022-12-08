import * as React from 'react';

import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Network, start, StartParams } from 'react-native-helios';
import { ethers } from 'ethers';

const ENVIRONMENTS: {
  readonly [key in Network]: Pick<
    StartParams,
    'untrusted_rpc_url' | 'consensus_rpc_url'
  >;
} = {
  [Network.MAINNET]: {
    consensus_rpc_url: 'https://www.lightclientdata.org',
    untrusted_rpc_url:
      'https://eth-mainnet.g.alchemy.com/v2/pPwfAKdQqDr1OP-z5Txzmlk0YE1UvAQT',
  },
  [Network.GOERLI]: {
    consensus_rpc_url: 'http://testing.prater.beacon-api.nimbus.team',
    untrusted_rpc_url:
      'https://eth-goerli.g.alchemy.com/v2/LyCUMBtAaTf03kVgcjPvW22KkwuKigZY',
  },
};

const network: Network = Network.MAINNET;
const rpc_port = 8545;

const url = `http://${
  Platform.OS === 'android' ? 'localhost' : '127.0.0.1'
}:${rpc_port}`;

export default function App() {
  React.useEffect(
    () =>
      void (async () => {
        try {
          await start({
            ...ENVIRONMENTS[network],
            network,
            rpc_port,
          });

          const provider = await ethers.providers.getDefaultProvider(url);

          const [blockNumber, balance] = await Promise.all([
            provider.getBlockNumber(),
            provider.getBalance('0x312e71162Df834A87a2684d30562b94816b0f072'),
          ]);

          console.warn(
            `Block number is: ${blockNumber} and balance is ${ethers.utils.formatEther(
              balance
            )}Ξ!`
          );
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
      <Text children={`Your RPC is running on ${url}.`} />
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
