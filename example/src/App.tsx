import * as React from 'react';

import { StyleSheet, View, NativeModules } from 'react-native';
import { start } from 'react-native-helios';
//import { ethers } from 'ethers';

export default function App() {
  React.useEffect(
    () =>
      void (async () => {
        try {
          await start({
            // If you encounter any errors, please try creating your own Alchemy key.
            untrusted_rpc_url:
              // https://github.com/scaffold-eth/scaffold-eth/blob/db24f28d1121468a08e7eed9affee43b0987aa10/packages/react-app/src/constants.js#L10
              'https://eth-mainnet.g.alchemy.com/v2/oKxs-03sij-U_N0iOlrSsZFr29-IqbuF',
            consensus_rpc_url: 'https://www.lightclientdata.org',
          });

          //const provider = await ethers.providers.getDefaultProvider(
          //  'http://127.0.0.1:8545'
          //);

          //const [blockNumber, balance] = await Promise.all([
          //  provider.getBlockNumber(),
          //  provider.getBalance('0x312e71162Df834A87a2684d30562b94816b0f072'),
          //]);

          //console.warn(
          //  `Block number is: ${blockNumber} and balance is ${ethers.utils.formatEther(
          //    balance
          //  )}Ξ!`
          //);
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
