import * as React from 'react';

import { Image, StyleSheet, View } from 'react-native';
import {
  Network,
  start,
  StartParams,
  getHeliosProvider,
} from 'react-native-helios';

const ethereumMainnet: StartParams = {
  network: Network.MAINNET,
  consensus_rpc_url: 'https://www.lightclientdata.org',
  untrusted_rpc_url:
    'https://eth-mainnet.g.alchemy.com/v2/Egs_eiq_v9XNiov1uyRJUWgKn0yb-qWU',
  rpc_port: 8545,
};

const ethereumGoerli: StartParams = {
  network: Network.GOERLI,
  consensus_rpc_url: 'http://testing.prater.beacon-api.nimbus.team',
  untrusted_rpc_url:
    'https://eth-goerli.g.alchemy.com/v2/x-e_64tklpNvyirgtckXvIGEBHp7XbXB',
  rpc_port: 8546,
};

const ENVIRONMENTS: readonly StartParams[] = [ethereumMainnet, ethereumGoerli];

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

          const providers = await Promise.all(
            ENVIRONMENTS.map(getHeliosProvider)
          );

          const blockNumbers = await Promise.all(
            providers.map((provider) => provider.getBlockNumber())
          );

          console.warn(
            blockNumbers.map((blockNumber) => blockNumber.toString())
          );

          console.warn(
            await getHeliosProvider(ethereumMainnet).getCode(
              '0x00000000006c3852cbEf3e08E8dF289169EdE581'
            )
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
