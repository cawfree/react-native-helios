import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

const build = path.resolve('build');

fs.existsSync(build) && fs.rmSync(build, { recursive: true });
fs.mkdirSync(build);

const stdio = 'inherit';

// https://blog.rust-lang.org/2020/01/03/reducing-support-for-32-bit-apple-targets.html
const RUST_VERSION_APPLE_32BIT_BINARIES = '1.41.0';
const RUST_VERSION_LATEST = 'nightly';

const APPLE_TARGETS: Record<string, readonly string[]> = {
  [RUST_VERSION_APPLE_32BIT_BINARIES]: [
    'aarch64-apple-ios',
    'aarch64-apple-ios-sim',
    'armv7-apple-ios',
    'armv7s-apple-ios',
    'x86_64-apple-ios',
    'i386-apple-ios',
  ],
  [RUST_VERSION_LATEST]: [
    'aarch64-apple-ios',
    'x86_64-apple-ios',
    'aarch64-apple-ios-sim',
  ],
};

const rust_version = RUST_VERSION_LATEST;

child_process.execSync('git clone https://github.com/a16z/helios', {
  cwd: build,
  stdio,
});

child_process.execSync('rustup default stable', { cwd: build, stdio });

child_process.execSync(`rustup install ${rust_version}`, { cwd: build, stdio });

child_process.execSync(`rustup default ${rust_version}`, { cwd: build, stdio });

child_process.execSync('rustup --version', { cwd: build, stdio });

if (!APPLE_TARGETS[rust_version])
  throw new Error(`Missing apple targets for "${rust_version}".`);

child_process.execSync(
  `rustup target add ${APPLE_TARGETS[rust_version].join(' ')}`,
  { stdio, cwd: build }
);

child_process.execSync(
  'rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android',
  { stdio, cwd: build }
);

child_process.execSync('cargo install cargo-lipo', {
  cwd: build,
  stdio,
});

const name = 'helios';
const checksum = '4c72344b55991b6296ccbb12b3c9e3ad634d593e';

const helios = path.resolve(build, name);

child_process.execSync(`git reset --hard ${checksum}`, { stdio, cwd: helios });

const src = path.resolve(helios, 'src');
const lib_rs = path.resolve(src, 'lib.rs');

fs.writeFileSync(
  lib_rs,
  [
    'use std::collections::HashMap;',
    'use std::ffi::{CStr, CString};',
    '',
    'use ::client::{database::FileDB, Client, ClientBuilder};',
    'use ::config::{CliConfig, Config, networks};',
    '',
    '#[swift_bridge::bridge]',
    'mod ffi {',
    '',
    '  extern "Rust" {',
    '    type RustApp;',
    '',
    '    #[swift_bridge(init)]',
    '    fn new() -> RustApp;',
    '',
    '    async fn helios_start(&mut self, untrusted_rpc_url: String, consensus_rpc_url: String);',
    '    async fn helios_get_block_number(&mut self) -> String;',
    '  }',
    '}',
    '',
    'impl RustApp {',
    '',
    '  pub fn new() -> Self {',
    '    RustApp {',
    '      client: None,',
    '    }',
    '}',
    '',
    '  async fn helios_start(',
    '    &mut self,',
    '    untrusted_rpc_url: String,',
    '    consensus_rpc_url: String',
    '  ) {',
    '    let mut client = ClientBuilder::new()',
    '      .network(networks::Network::MAINNET)',
    '      .consensus_rpc(&consensus_rpc_url)',
    '      .execution_rpc(&untrusted_rpc_url)',
    '      .rpc_port(8545)',
    '      .build()',
    '      .unwrap();',
    '',
    '    client.start().await.unwrap();',
    '',
    '    self.client = Some(client);',
    '  }',
    '',
    '  async fn helios_get_block_number(&mut self) -> String {',
    '    if let Some(client) = &self.client {',
    '      return client.get_block_number().await.unwrap().to_string();',
    '    }',
    '    return (-1).to_string();',
    '  }',
    '',
    '}',
    '',
    'pub struct RustApp {',
    '  client: Option<Client<FileDB>>,',
    '}',
  ].join('\n')
);

const build_rs = path.resolve(helios, 'build.rs');

fs.writeFileSync(
  build_rs,
  [
    'use std::path::PathBuf;',
    '',
    'fn main() {',
    '  let out_dir = PathBuf::from("./generated");',
    '  let bridges = vec!["src/lib.rs"];',
    '  for path in &bridges {',
    '    println!("cargo:rerun-if-changed={}", path);',
    '  }',
    '  swift_bridge_build::parse_bridges(bridges)',
    '    .write_all_concatenated(out_dir, env!("CARGO_PKG_NAME"));',
    '}',
  ].join('\n')
);

const build_sh = path.resolve(helios, 'build.sh');

fs.writeFileSync(
  build_sh,
  [
    '#!/bin/bash',
    '',
    'set -e',
    '',
    'THISDIR=$(dirname $0)',
    'cd $THISDIR',
    'export SWIFT_BRIDGE_OUT_DIR="$(pwd)/generated"',
    '',
    //`cargo lipo --release --targets ${APPLE_TARGETS[rust_version].join(',')}`,
    'cargo build --target aarch64-apple-ios-sim',
  ].join('\n')
);

const header = path.resolve(helios, `lib${name}.h`);
const library = path.resolve(helios, 'SwiftBridgeCore.swift');
const toml = path.resolve(helios, 'Cargo.toml');

fs.writeFileSync(
  toml,
  [
    ...fs
      .readFileSync(toml, 'utf-8')
      .split('\n')
      .flatMap((str) => {
        if (str === '[patch.crates-io]') {
          return [
            str,
            //'openssl-src = { version = "300", optional = true }',
            //'openssl-src = { git = "https://github.com/sfackler/rust-openssl", version = "=300.0.11+3.0.7", optional = true }',
            //'openssl-sys = { git = "https://github.com/ncitron/ethers-rs", branch = "fix-retry" }',
          ];
        }

        //'openssl-src = { version = "300" }',

        if (str === '[dependencies]') {
          return [
            '[build-dependencies]',
            'swift-bridge-build = "0.1"',
            '',
            str,
            'swift-bridge = {version = "0.1", features = ["async"]}',
            '',
            // TODO: Check these are still required?
            'futures = "0.3.23"',
            'eyre = "0.6.8"',
          ];
        } else if (str === '[package]') {
          return [str, 'build = "build.rs"'];
        }
        return str;
      }),
    '[lib]',
    `name = "${name}"`,
    'crate-type = ["staticlib"]',
  ].join('\n')
);

child_process.execSync('rustup component list --installed', {
  stdio,
  cwd: helios,
});

child_process.execSync(`chmod +x ${build_sh}`, { stdio, cwd: helios });

child_process.execSync(build_sh, { stdio, cwd: helios });

child_process.execSync('rustup default stable', { cwd: build, stdio });

const generated = path.resolve(helios, 'generated');
const generated_helios_h = path.resolve(generated, name, `${name}.h`);
const generated_helios_swift = path.resolve(generated, name, `${name}.swift`);
const generated_swift_bridge_h = path.resolve(generated, 'SwiftBridgeCore.h');
const generated_swift_bridge_swift = path.resolve(
  generated,
  'SwiftBridgeCore.swift'
);

const result_h = [
  ...fs.readFileSync(generated_swift_bridge_h, 'utf-8').split('\n'),
  // HACK: For now we'll remove generated #imports since we assume they'll be included
  //       by generated_swift_bridge_h.
  ...fs
    .readFileSync(generated_helios_h, 'utf-8')
    .split('\n')
    .filter((e) => !e.startsWith('#include')),
].join('\n');

fs.writeFileSync(
  library,
  `
${fs.readFileSync(generated_swift_bridge_swift, 'utf-8')}

${fs
  .readFileSync(generated_helios_swift, 'utf-8')
  .split('\n')
  // HACK: Annotate async methods with the available annotation.
  .flatMap((str) => {
    if (!str.startsWith('extension')) return [str];
    return ['@available(iOS 13.0.0, *)', str];
  })
  .join('\n')}
  `.trim()
);

fs.writeFileSync(header, result_h);

const ios = path.resolve('ios');

const staticLib = path.resolve(
  helios,
  'target',
  'universal',
  'release',
  `lib${name}.a`
);

fs.copyFileSync(header, path.resolve(ios, path.basename(header)));
fs.copyFileSync(staticLib, path.resolve(ios, path.basename(staticLib)));
fs.copyFileSync(library, path.resolve(ios, path.basename(library)));

child_process.execSync('rm -rf node_modules ; rm yarn.lock ; yarn add ../', {
  stdio,
  cwd: path.resolve('example'),
});

child_process.execSync('pod install', {
  stdio,
  cwd: path.resolve('example', 'ios'),
});
