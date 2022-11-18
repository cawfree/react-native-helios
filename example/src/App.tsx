import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { start } from 'react-native-helios';
import { ethers } from 'ethers';

export default function App() {
  React.useEffect(
    () =>
      void (async () => {
        try {
          await start({
            untrusted_rpc_url:
              'https://eth-mainnet.g.alchemy.com/v2/NgIm1_QkhzUdPRm6-WFftLQ6IpB5X712',
            consensus_rpc_url: 'https://www.lightclientdata.org',
          });

          const provider = await ethers.providers.getDefaultProvider(
            'http://127.0.0.1:8545'
          );

          const [blockNumber, balance] = await Promise.all([
            provider.getBlockNumber(),
            provider.getBalance('cawfree.eth'),
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

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
});
