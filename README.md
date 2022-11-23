# react-native-helios

> ⚠️ Currently `react-native-helios` only supports execution on iOS devices and simulators.

Throughout the majority of [__Ethereum__](https://ethereum.org/en/)'s history, frontend applications have been forced to rely upon centralized interfaces like [__Infura__](https://www.infura.io/) to access the decentralized network. This is because to be a meaningful participant in the decentralized network, like an entity capable of submitting transactions or maintaining a verifiable history the network state, the protocol's current design [__demands high device specifications__](https://youtu.be/0stc9jnQLXA?t=136) that are insurmountable for even high-end mobile devices.

This reliance on third party ethereum providers is useful for developers, but are subject to the downfalls of all centralized systems; susceptibility to downtime and subservience to censorship and financialization.

> ⚠️ __Decentralization is incredibly important!__
>
> At the time of writing, [__DeFi__](https://ethereum.org/en/defi) frontends are threatened into enforcing censorship upon honest users, miners are incentivised to censor global transactions in compliance with the US-based [__OFAC__](https://youtu.be/Ytaa_5liwMA?t=4429), and the relative ease of centralized interfaces compared to truly decentralized equivalents lure users into [__extreme losses due to excessive trust__](https://twitter.com/JG_Nuke/status/1591070331988774913).
>
> The decentralized future is __inclusive of every human__, is __objective__ and __credibly neutral__.

## Introducing [`helios`](https://github.com/a16z/helios)! 👋

[__Helios__](https://github.com/a16z/helios) is an innovative new [__light client__](https://ethereum.org/en/developers/docs/nodes-and-clients/) for Ethereum which is minimal enough to run on mobile devices or even from within [__React Native__](https://reactnative.dev) applications.

The key property enabled by `helios`, compared to traditional light clients, is the level of trustlessness.

Where contemporary light clients merely _defer_ responsibility to a more powerful node, [`helios`](https://github.com/a16z/helios) is capable of maintaining the state of the decentralized network autonomously by _inferring_ the validity of the chain header by assessing the validity of the proof sequence that constitutes the canonical chain.

Much like the proposed design of the [__Portal Network__](https://www.ethportal.net/), [`helios`](https://github.com/a16z/helios) need only once trust a potentially untrustworthy block header proof provider just _once_ in order to quickly synchronize with canonical Ethereum chain, verify it's validity, and transact as an independent network participant from there.

[__❯ Learn more__](https://a16zcrypto.com/building-helios-ethereum-light-client/)

## `react-native-helios` ⚛️

[`react-native-helios`](https://github.com/cawfree) is a [__React Native__](https://reactnative.dev) wrapper for [`helios`](https://github.com/a16z/helios).

By leveraging [`swift-bridge`](https://github.com/chinedufn/swift-bridge), we can automatically generate an [__Swift__](https://developer.apple.com/swift/)-compatible [__Native Module__](https://reactnative.dev/docs/native-modules-intro) which bridges into the original [__Rust__](https://www.rust-lang.org/) client and executes this on your mobile device.

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
const provider = await ethers.providers.getDefaultProvider(
  'http://127.0.0.1:8545'
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

> __Note__ Currently, [`react-native-helios`](https://github.com/cawfree/react-native-helios) may only be compiled on Apple Silicon based Macs.

1. Make sure you've installed [`rustup`](https://www.rust-lang.org/tools/install):

```shell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Clone and build [`react-native-helios`](https://github.com/cawfree/react-native-helios):

```shell
git clone https://github.com/cawfree/react-native-helios
cd react-native-helios
yarn && yarn heliosup
```

> Once this task has completed, the rust library dependencies will be compiled for iOS using [`cargo-lipo`](https://github.com/TimNN/cargo-lipo), a runtime-compatible bridge interface for the generated binaries will be exported by [`swift-bridge`](https://github.com/chinedufn/swift-bridge), and the [`example/`](./example) project's [__pods__](https://cocoapods.org/) directory will be populated with the new library binaries.
>
> To support the `arm64` architecture for both simulated and physical iOS devices, the target-specific static libraries are repackaged into an [`XCFramework`](https://medium.com/trueengineering/xcode-and-xcframeworks-new-format-of-packing-frameworks-ca15db2381d3).

3. Finally, open up the [`example .xcworkspace`](./example/ios) and hit play ▶.

## License ✌️

[__MIT__](./LICENSE)
