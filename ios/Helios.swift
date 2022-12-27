import Foundation

@objc(Helios)
class Helios: NSObject {

  var RUST_APPS = [String: RustApp]();

  public static func requiresMainQueueSetup() -> Bool {
    return true;
  }

  @objc func start(_ params:NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
      if #available(iOS 13.0.0, *) {
          let rustApp = RustApp();

          let untrusted_rpc_url = params["untrusted_rpc_url"];
          let consensus_rpc_url = params["consensus_rpc_url"];
          let rpc_port = params["rpc_port"];
          let network = params["network"];

          let key = String(format: "%.0f", rpc_port as! Double);

          let task = Task {
              await rustApp.helios_start(
                (untrusted_rpc_url as! String),
                (consensus_rpc_url as! String),
                (rpc_port as! Double),
                (network as! String)
              );

              RUST_APPS[key] = rustApp;
              resolve("");
          }
      } else {
          // Fallback on earlier versions
          reject("", "", nil);
      };
  }

  @objc func shutdown(_ params:NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
      if #available(iOS 13.0.0, *) {
          let rpc_port = params["rpc_port"];
          let key = String(format: "%.0f", rpc_port as! Double);

          let rustApp = RUST_APPS[key];

          let task = Task {
            await rustApp!.helios_shutdown();

            RUST_APPS.removeValue(forKey: key);
            resolve("");
          }
      } else {
          // Fallback on earlier versions
          reject("", "", nil);
      };
  }

}
