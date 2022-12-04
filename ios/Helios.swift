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

          RUST_APPS["default"] = rustApp;

          let task = Task {
              await rustApp.helios_start(
                (untrusted_rpc_url as! String),
                (consensus_rpc_url as! String)
              );
              resolve("");
          }
      } else {
          // Fallback on earlier versions
          reject("", "", nil);
      };
  }

}
