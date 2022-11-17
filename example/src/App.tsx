import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { start } from 'react-native-helios';

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
          console.warn('Started!');
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
