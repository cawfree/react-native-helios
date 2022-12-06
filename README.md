# react-native-helios

> ⚠️ Currently `react-native-helios` only supports execution on iOS and Android.

Throughout the majority of [__Ethereum__](https://ethereum.org/en/)'s history, frontend applications have been forced to rely upon centralized interfaces like [__Infura__](https://www.infura.io/) to access the decentralized network. This is because to act as a meaningful participant to the network, such as an entity capable of submitting transactions or maintaining a verifiable history the network state, the protocol's current design [__demands high device specifications__](https://youtu.be/0stc9jnQLXA?t=136) that are insurmountable for even top-end mobile devices.

This reliance on third party infrastructure typically aided the delivery of ethereum frontend applications, but is subject to the pitfalls of all centralized systems; susceptibility to downtime and subservience to censorship and monetization.

## Introducing [`helios`](https://github.com/a16z/helios)! 👋

[__Helios__](https://github.com/a16z/helios) is an innovative new [__light client__](https://ethereum.org/en/developers/docs/nodes-and-clients/) for Ethereum which is minimal enough to run on mobile devices or even from within [__React Native__](https://reactnative.dev) applications.

The key property enabled by `helios`, compared to traditional light clients, is the level of trustlessness.

Where contemporary light clients merely _defer_ responsibility to a more powerful node, [`helios`](https://github.com/a16z/helios) is capable of maintaining the state of the decentralized network autonomously by _inferring_ the validity of the chain header by assessing the validity of the proof sequence that constitutes the canonical chain.

Much like the proposed design of the [__Portal Network__](https://www.ethportal.net/), [`helios`](https://github.com/a16z/helios) need only trust a potentially untrustworthy block header proof provider just _once_ in order to quickly synchronize with canonical Ethereum chain, verify it's validity, and transact as an independent network participant.

[__❯ Learn more__](https://a16zcrypto.com/building-helios-ethereum-light-client/)

## `react-native-helios` ⚛️

[`react-native-helios`](https://github.com/cawfree) is a [__React Native__](https://reactnative.dev) wrapper for [`helios`](https://github.com/a16z/helios):

```sh
yarn add react-native-helios
```

To instantiate a trustless [__JSON-RPC__](https://ethereum.org/en/developers/docs/apis/json-rpc/#:~:text=JSON%2DRPC%20is%20a%20stateless,many%20various%20message%20passing%20environments.), we merely need to call the `start()` method:

```typescript
import { start } from 'react-native-helios';

await start({
  untrusted_rpc_url:
    'https://eth-mainnet.g.alchemy.com/v2/<your-alchemy-key>', // source of initial proofs
  consensus_rpc_url: 'https://www.lightclientdata.org',
});

console.log("Ready!");
```

This will establish a JSON-RPC on your device running at `http://127.0.0.1:8485`, which can then be interacted like usual using [`ethers`](https://github.com/ethers-io/ethers.js/):

```typescript
import { Platform } from 'react-native';
import { ethers } from 'ethers';

const provider = await ethers.providers.getDefaultProvider(
  `http://${
    Platform.OS === 'android' ? 'localhost' : '127.0.0.1'
  }:8545`
);

const [blockNumber, balance] = await Promise.all([
  provider.getBlockNumber(),
  provider.getBalance('cawfree.eth'),
]);

console.log(
  `Block number is: ${blockNumber} and balance is ${ethers.utils.formatEther(
    balance
  )}Ξ!`
);
```

## Building from source 🏗

> __Note__ Currently, [`react-native-helios`](https://github.com/cawfree/react-native-helios) may only be compiled on Apple Silicon.

1. Make sure you've installed [`rustup`](https://www.rust-lang.org/tools/install):

```shell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Clone and build [`react-native-helios`](https://github.com/cawfree/react-native-helios):

```shell
git clone https://github.com/cawfree/react-native-helios
cd react-native-helios
yarn ; yarn heliosup
```

> For iOS, we leverage [`swift-bridge`](https://github.com/chinedufn/swift-bridge) and `cargo-lipo`](https://github.com/TimNN/cargo-lipo) to automatically generate a [__Swift__](https://developer.apple.com/swift/)-compatible [__Native Module__](https://reactnative.dev/docs/native-modules-intro) which bridges into the original [__Rust__](https://www.rust-lang.org/) client. To support the `arm64` architecture for both simulated and physical iOS devices, the target-specific static libraries are repackaged into an [`XCFramework`](https://medium.com/trueengineering/xcode-and-xcframeworks-new-format-of-packing-frameworks-ca15db2381d3).
> 
> For Android, we use [`flapigen`](https://github.com/Dushistov/flapigen-rs) and [rifgen](https://docs.rs/rifgen/latest/rifgen/) to synthesize a runtime-compatible interface. Currently, only the build architectures `arm64_v8a` and `x86_64` are supported.
>

3. Finally, run the [__Example Project__](./example).

## License ✌️

[__MIT__](./LICENSE)
