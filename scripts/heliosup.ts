import 'dotenv/config';

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

const nightly_version = '2022-12-17';
const rust_version = `nightly-${nightly_version}`;
const patch_crates_io = '[patch.crates-io]';

const name = 'helios';
const helios_checksum = '8da632f8f2902a0095bc1fcd6e1a1008950c7002';

// IMPORTANT! Must point to a version which is identical to the version of openssl-src referenced by helios' Cargo.lock.
// Else, the patch will be ignored.
const openssl_sys_checksum = 'dc976d756f9d3273c3c6f960fadb88e44b468050';

const stdio = 'inherit';
const build = path.resolve('build');
const ios = path.resolve('ios');
const android = path.resolve('android');

const example = path.resolve('example');
const example_ios = path.resolve(example, 'ios');

const helios = path.resolve(build, name);
const helios_toml = path.resolve(helios, 'Cargo.toml');
const helios_build_rs = path.resolve(helios, 'build.rs');

const rust_openssl = path.resolve(build, 'openssl');
const openssl_sys = path.resolve(rust_openssl, 'openssl-sys');

const libs = path.resolve(android, 'src', 'main', 'jniLibs');

const arm64_v8a = path.resolve(libs, 'arm64-v8a');
//const armeabi_v7a = path.resolve(libs, 'armeabi-v7a');
//const x86 = path.resolve(libs, 'x86');
const x86_64 = path.resolve(libs, 'x86_64');

const getSelectedNetwork = () => [
  '    let selectedNetwork = match network.as_str() {',
  '      "MAINNET" => networks::Network::MAINNET,',
  '      "GOERLI" => networks::Network::GOERLI,',
  '      _ => panic!("Unknown network!"),',
  '    };',
];

const injectPatch = (file: string, fileToPatch: string) => {
  const c = fs.readFileSync(file, 'utf-8').split('\n');
  const i = c.indexOf(patch_crates_io);

  fs.writeFileSync(
    file,
    (i >= 0
      ? [
          ...c.filter((_, j) => j <= i),
          fileToPatch,
          ...c.filter((_, j) => j > i),
        ]
      : [...c, '', patch_crates_io, fileToPatch]
    ).join('\n')
  );
};

abstract class HeliosFactory {
  private static prepareBuildDir(): void {
    fs.existsSync(build) && fs.rmSync(build, { recursive: true });
    fs.mkdirSync(build);
  }

  private static checkoutHelios(): void {
    child_process.execSync('git clone https://github.com/a16z/helios', {
      cwd: build,
      stdio,
    });
    child_process.execSync(`git reset --hard ${helios_checksum}`, {
      stdio,
      cwd: helios,
    });
  }

  private static checkoutOpenSsl(): void {
    child_process.execSync(
      `git clone https://github.com/sfackler/rust-openssl ${rust_openssl}`,
      { stdio }
    );

    child_process.execSync(`git checkout ${openssl_sys_checksum}`, {
      stdio,
      cwd: openssl_sys,
    });

    const openssl_sys_toml = path.resolve(openssl_sys, 'Cargo.toml');

    fs.writeFileSync(
      openssl_sys_toml,
      fs
        .readFileSync(openssl_sys_toml, 'utf-8')
        .split('\n')
        .flatMap((e) => {
          if (e.startsWith('openssl-src'))
            return ['openssl-src = { version = "300", optional = true }'];

          return [e];
        })
        .join('\n')
    );
  }

  protected constructor() {}

  protected abstract getTargets(): readonly string[];
  protected abstract getCargoDependencies(): readonly string[];
  protected abstract getLibrarySource(): readonly string[];
  protected abstract getCrateType(): string;
  protected abstract customizeCargo(
    current: readonly string[]
  ): readonly string[];
  protected abstract prepareBuildWorkspace(): void;
  protected abstract getBuildScriptSource(): readonly string[];
  protected abstract handleBuildCompletion(): void;

  public compile(): void {
    HeliosFactory.prepareBuildDir();

    child_process.execSync('rustup default stable', { cwd: build, stdio });

    child_process.execSync(`rustup install ${rust_version}`, {
      cwd: build,
      stdio,
    });

    child_process.execSync(
      `rustup component add rust-src --toolchain nightly-${nightly_version}-aarch64-apple-darwin`,
      {
        cwd: build,
        stdio,
      }
    );

    child_process.execSync(`rustup default ${rust_version}`, {
      cwd: build,
      stdio,
    });

    child_process.execSync('rustup --version', { cwd: build, stdio });

    child_process.execSync(`rustup target add ${this.getTargets().join(' ')}`, {
      stdio,
      cwd: build,
    });

    this.getCargoDependencies().length &&
      child_process.execSync(
        `cargo install ${this.getCargoDependencies().join(' ')}`,
        {
          cwd: build,
          stdio,
        }
      );

    HeliosFactory.checkoutHelios();
    HeliosFactory.checkoutOpenSsl();

    fs.writeFileSync(
      helios_toml,
      [
        ...fs.readFileSync(helios_toml, 'utf-8').split('\n'),
        '',
        '[lib]',
        `name = "${name}"`,
        `crate-type = ["${this.getCrateType()}"]`,
      ].join('\n')
    );

    injectPatch(helios_toml, `openssl-sys = { path = "${openssl_sys}" }`);

    fs.writeFileSync(
      helios_toml,
      this.customizeCargo(
        fs.readFileSync(helios_toml, 'utf-8').split('\n')
      ).join('\n')
    );

    this.prepareBuildWorkspace();

    const build_sh = path.resolve(helios, 'build.sh');
    fs.writeFileSync(build_sh, this.getBuildScriptSource().join('\n'));

    const src = path.resolve(helios, 'src');
    const lib_rs = path.resolve(src, 'lib.rs');
    fs.writeFileSync(lib_rs, this.getLibrarySource().join('\n'));

    child_process.execSync(`chmod +x ${build_sh}`, { stdio, cwd: helios });
    child_process.execSync(build_sh, { stdio, cwd: helios });

    child_process.execSync('rustup default stable', { cwd: build, stdio });

    this.handleBuildCompletion();
  }
}

class AppleHeliosFactory extends HeliosFactory {
  constructor() {
    super();
  }
  protected getTargets(): readonly string[] {
    return ['aarch64-apple-ios', 'aarch64-apple-ios-sim'];
  }
  protected getCargoDependencies(): readonly string[] {
    return [];
  }
  protected getLibrarySource(): readonly string[] {
    return [
      'use std::collections::HashMap;',
      'use std::ffi::{CStr, CString};',
      '',
      'use ::client::{database::FileDB, Client, ClientBuilder};',
      'use ::config::{CliConfig, Config, networks};',
      '',
      'use std::path::PathBuf;',
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
      '    async fn helios_start(',
      '      &mut self,',
      '      untrusted_rpc_url: String,',
      '      consensus_rpc_url: String,',
      '      rpc_port: f64,',
      '      network: String,',
      '      data_dir: String,',
      '    );',
      '    async fn helios_shutdown(&mut self);',
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
      '    consensus_rpc_url: String,',
      '    rpc_port: f64,',
      '    network: String,',
      '    data_dir: String,',
      '  ) {',
      ...getSelectedNetwork(),
      '    let mut client: Client<FileDB> = ClientBuilder::new()',
      '      .network(selectedNetwork)',
      '      .execution_rpc(&untrusted_rpc_url)',
      '      .consensus_rpc(&consensus_rpc_url)',
      '      .data_dir(PathBuf::from(&data_dir))',
      '      .rpc_port((rpc_port as i16).try_into().unwrap())',
      // TODO: to boolean prop
      '      .load_external_fallback()',
      '      .build()',
      '      .unwrap();',
      '',
      '    client.start().await.unwrap();',
      '',
      '    self.client = Some(client);',
      '  }',
      '  async fn helios_shutdown(&mut self) {',
      '    if let Some(client) = &self.client {',
      '      client.shutdown().await;',
      '    }',
      '    self.client = None;',
      '    return;',
      '  }',
      '',
      '}',
      '',
      'pub struct RustApp {',
      '  client: Option<Client<FileDB>>,',
      '}',
    ];
  }
  protected getCrateType(): string {
    return 'staticlib';
  }
  protected customizeCargo(current: readonly string[]): readonly string[] {
    return [
      ...current.flatMap((str) => {
        if (str === '[dependencies]') {
          return [
            '[build-dependencies]',
            'swift-bridge-build = "0.1"',
            '',
            str,
            'swift-bridge = {version = "0.1", features = ["async"]}',
          ];
        }

        if (str === '[package]') return [str, 'build = "build.rs"'];

        //if (str === 'strip = true') return [];
        //if (str === 'opt-level = "z"') return [];
        //if (str === 'lto = true') return [];
        //if (str === 'codegen-units = 1') return [];

        // This PR regressed builds on iOS: https://github.com/a16z/helios/pull/160
        // It would cause an error, "duplicate lang item in crate `core`: `sized`".
        if (str === 'panic = "abort"') return [];

        return [str];
      }),
    ];
  }

  protected prepareBuildWorkspace() {
    fs.writeFileSync(
      helios_build_rs,
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
  }

  protected getBuildScriptSource(): readonly string[] {
    return [
      '#!/bin/bash',
      '',
      'set -e',
      '',
      'THISDIR=$(dirname $0)',
      'cd $THISDIR',
      'export SWIFT_BRIDGE_OUT_DIR="$(pwd)/generated"',
      '',
      //'cargo fix --lib -p helios --allow-dirty',
      '',
      // https://gist.github.com/surpher/bbf88e191e9d1f01ab2e2bbb85f9b528#universal-ios-arm64-mobile-device--x86_64-simulator
      'cargo build -Z build-std --target aarch64-apple-ios --release ',
      // https://gist.github.com/surpher/bbf88e191e9d1f01ab2e2bbb85f9b528#ios-simulator-arm64
      'cargo build -Z build-std --target aarch64-apple-ios-sim --release',

      // Mac Catalyst
      // TODO: https://nadim.computer/posts/2022-02-11-maccatalyst.html
    ];
  }
  protected handleBuildCompletion() {
    const generated = path.resolve(helios, 'generated');
    const generated_helios_h = path.resolve(generated, name, `${name}.h`);
    const generated_helios_swift = path.resolve(
      generated,
      name,
      `${name}.swift`
    );
    const generated_swift_bridge_h = path.resolve(
      generated,
      'SwiftBridgeCore.h'
    );
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

    const header = path.resolve(helios, `lib${name}.h`);
    const library = path.resolve(helios, 'SwiftBridgeCore.swift');

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

    // TODO: Before we were excluding x86_64; verify builds are successful.
    const appleStaticLibs = this.getTargets().map((target) =>
      path.resolve(helios, 'target', target, 'release', `lib${name}.a`)
    );

    const xcframework = path.resolve(helios, `lib${name}.xcframework`);

    child_process.execSync(
      `xcodebuild -create-xcframework ${appleStaticLibs
        .map((e) => `-library ${e} -headers ${header}`)
        .join(' ')} -output ${xcframework}`,
      { stdio, cwd: helios }
    );

    const target_xcworkspace = path.resolve(ios, path.basename(xcframework));

    if (fs.existsSync(target_xcworkspace))
      fs.rmSync(target_xcworkspace, { recursive: true });

    fs.renameSync(xcframework, target_xcworkspace);

    fs.copyFileSync(library, path.resolve(ios, path.basename(library)));
    fs.copyFileSync(header, path.resolve(ios, path.basename(header)));
  }
}

class AndroidHeliosFactory extends HeliosFactory {
  static ANDROID_LIBRARY_LUT = {
    'aarch64-linux-android': arm64_v8a,
    // TODO: Enable these targets.
    //'armv7-linux-androideabi': armeabi_v7a,
    //'i686-linux-android': x86,
    'x86_64-linux-android': x86_64,
  };
  constructor() {
    super();
  }
  protected getTargets(): readonly string[] {
    return Object.keys(AndroidHeliosFactory.ANDROID_LIBRARY_LUT);
  }
  protected getCargoDependencies(): readonly string[] {
    return ['cargo-ndk'];
  }
  protected getBuildScriptSource(): readonly string[] {
    return [
      '#!/usr/bin/env bash',
      '',
      'rustup target add aarch64-linux-android',
      'rustup target install x86_64-linux-android',
      //'cargo fix --lib -p helios --allow-dirty',
      '',
      this.getTargets()
        .map((target) => `cargo ndk --target ${target} -- build --release`)
        .join(' && '),
    ];
  }
  protected getCrateType(): string {
    return 'cdylib';
  }
  protected customizeCargo(current: readonly string[]): readonly string[] {
    return [
      ...current.flatMap((str) => {
        if (str === '[dependencies]') {
          return [
            '[build-dependencies]',
            'flapigen = "0.6.0-pre13"',
            'rifgen = "0.1.61"',
            '',
            str,
            'rifgen = "0.1.61"',
            'jni-sys = "0.3.0"',
            'log = "0.4.6"',
            'log-panics = "2.0"',
            'tokio = "1.22.0"',
          ];
        } else if (str === '[package]') return [str, 'build = "build.rs"'];
        return [str];
      }),
      '',
      '[target.\'cfg(target_os = "android")\'.dependencies]',
      'jni = { version = "0.13.1", default-features = false }',
    ];
  }
  protected prepareBuildWorkspace() {
    if (fs.existsSync(libs)) fs.rmSync(libs, { recursive: true });
    fs.mkdirSync(libs);

    Object.values(AndroidHeliosFactory.ANDROID_LIBRARY_LUT).forEach((dir) =>
      fs.mkdirSync(dir)
    );

    fs.writeFileSync(
      path.resolve(helios, 'src', 'java_glue.rs'),
      [
        '#![allow(',
        '  clippy::enum_variant_names,',
        '  clippy::unused_unit,',
        '  clippy::let_and_return,',
        '  clippy::not_unsafe_ptr_arg_deref,',
        '  clippy::cast_lossless,',
        '  clippy::blacklisted_name,',
        '  clippy::too_many_arguments,',
        '  clippy::trivially_copy_pass_by_ref,',
        '  clippy::let_unit_value,',
        '  clippy::clone_on_copy',
        ')]',
        '',
        'include!(concat!(env!("OUT_DIR"), "/java_glue.rs"));',
      ].join('\n')
    );

    fs.writeFileSync(
      helios_build_rs,
      [
        'use flapigen::{JavaConfig, LanguageConfig};',
        'use rifgen::{Generator, Language, TypeCases};',
        '',
        'use std::{env, path::Path};',
        'use std::fs;',
        '',
        'fn main() {',
        '  let out_dir = env::var("OUT_DIR").unwrap();',
        '  let in_src = Path::new("src").join("java_glue.rs.in");',
        '  let out_src = Path::new(&out_dir).join("java_glue.rs");',
        '',
        '  fs::write("README.md", out_src.display().to_string()).expect("Unable to write file");',
        '',
        '  Generator::new(TypeCases::CamelCase,Language::Java, "src")',
        '    .generate_interface(&in_src);',
        '',
        '  let swig_gen = flapigen::Generator::new(',
        '    LanguageConfig::JavaConfig(',
        '      JavaConfig::new(',
        '        Path::new("..")',
        '          .join("..")',
        '          .join("android")',
        '          .join("src")',
        '          .join("main")',
        '          .join("java")',
        '          .join("com")',
        '          .join("helios"),',
        '          "com.helios".into(),',
        '      )',
        '      .use_null_annotation_from_package("androidx.annotation".into()),',
        '    )',
        '  )',
        '  .rustfmt_bindings(true);',
        '',
        '  swig_gen.expand("android bindings", &in_src, &out_src);',
        '',
        '}',
      ].join('\n')
    );
  }
  protected getLibrarySource(): readonly string[] {
    return [
      'use log::info;',
      'use rifgen::rifgen_attr::*;',
      '',
      'mod java_glue;',
      'pub use crate::java_glue::*;',
      '',
      'use ::client::{database::FileDB, Client, ClientBuilder};',
      'use ::config::{CliConfig, Config, networks};',
      '',
      'use tokio::runtime::Runtime;',
      'use std::{thread, time::Duration};',
      'use std::path::PathBuf;',
      '',
      'pub struct Helios {',
      '  client: Option<Client<FileDB>>,',
      '  runtime: Runtime,',
      '}',
      '',
      'impl Helios {',
      '  #[generate_interface(constructor)]',
      '  pub fn new() -> Helios {',
      '    #[cfg(target_os = "android")]',
      '    Helios {',
      '      client: None,',
      '      runtime: Runtime::new().unwrap(),',
      '    }',
      '  }',
      '',
      '  #[generate_interface]',
      '  fn helios_start(',
      '    &mut self,',
      '    untrusted_rpc_url: String,',
      '    consensus_rpc_url: String,',
      '    rpc_port: f64,',
      '    network: String,',
      '    data_dir: String,',
      '  ) {',
      ...getSelectedNetwork(),
      '    self.runtime.block_on(async {',
      '      let mut client: Client<FileDB> = ClientBuilder::new()',
      '        .network(selectedNetwork)',
      '        .consensus_rpc(&consensus_rpc_url)',
      '        .execution_rpc(&untrusted_rpc_url)',
      '        .data_dir(PathBuf::from(&data_dir))',
      '        .rpc_port((rpc_port as i16).try_into().unwrap())',
      // TODO: to boolean prop
      '        .load_external_fallback()',
      '        .build()',
      '        .unwrap();',
      '',
      '      client.start().await;',
      '      self.client = Some(client);',
      '    });',
      '  }',
      '  #[generate_interface]',
      '  fn helios_shutdown(&mut self) {',
      '    self.runtime.block_on(async {',
      '      if let Some(client) = &self.client {',
      '        client.shutdown().await;',
      '      }',
      '      self.client = None;',
      '      return;',
      '    })',
      '  }',
      '}',
    ];
  }
  protected handleBuildCompletion() {
    Object.entries(AndroidHeliosFactory.ANDROID_LIBRARY_LUT).forEach(
      ([k, v]) => {
        const from = path.resolve(
          helios,
          'target',
          k,
          'release',
          `lib${name}.so`
        );
        const to = path.resolve(v, `lib${name}.so`);
        fs.copyFileSync(from, to);
      }
    );
  }
}

const onFinish = () => {
  // Sync up the example app.
  child_process.execSync('rm -rf node_modules ; rm yarn.lock ; yarn add ../', {
    stdio,
    cwd: example,
  });
  // Ensure pods are up to date.
  child_process.execSync('pod install', {
    stdio,
    cwd: example_ios,
  });
};

void (async () => {
  try {
    const { ANDROID_DISABLED, APPLE_DISABLED } = process.env as Partial<{
      readonly ANDROID_DISABLED: string;
      readonly APPLE_DISABLED: string;
    }>;

    const androidIsDisabled = ANDROID_DISABLED === String(true);
    const appleIsDisabled = APPLE_DISABLED == String(true);

    !androidIsDisabled && new AndroidHeliosFactory().compile();
    !appleIsDisabled && new AppleHeliosFactory().compile();

    onFinish();
  } catch (e) {
    console.error(e);
  }
})();
