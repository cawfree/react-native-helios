import Foundation

@objc(Helios)
class Helios: NSObject {

  public static func requiresMainQueueSetup() -> Bool {
    return true;
  }
  
  var INSTANCES = [String: RustApp]();
  
  private func getKey(pPort: Double) -> String {
    return String(format: "%.0f", pPort);
  }
    
  @available(iOS 13.0.0, *)
  private func shouldStopHelios(pPort: Double) async throws {
    let key = getKey(pPort: pPort);
    let rustApp = INSTANCES[key];
      
    if (rustApp == nil) {
      return;
    }
    
    await rustApp!.helios_shutdown();
    
    INSTANCES.removeValue(forKey: key);
  }
    
  @available(iOS 13.0.0, *)
  private func shouldStartHelios(
    pPort: Double,
    pUntrustedRpcUrl: String,
    pConsensusRpcUrl: String,
    pNetwork: String
  ) async throws {
    try await shouldStopHelios(pPort: pPort);
      
    let key = getKey(pPort: pPort);
      
    let rustApp = RustApp();
      
    await rustApp.helios_start(
      pUntrustedRpcUrl,
      pConsensusRpcUrl,
      pPort,
      pNetwork
    );
      
    INSTANCES[key] = rustApp;
  }
    
  func resolveOrReject(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock,
    runnable: @escaping () async  throws -> Any?
  ) {
    if #available(iOS 13.0, *) {
      Task {
        do {
          try await runnable();
          DispatchQueue.main.async { resolve(0); }
        } catch let error as NSError {
          DispatchQueue.main.async {
            reject("\(error.code)", error.userInfo.description, error);
          }
        }
      }
    } else {
      reject("-1", "iOS version must be greater than 13.0.0.", nil);
    }
  }

  @available(iOS 13.0.0, *)
  @objc func start(_ params:NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    resolveOrReject(resolve: resolve, reject: reject) {
      let untrusted_rpc_url = params["untrusted_rpc_url"];
      let consensus_rpc_url = params["consensus_rpc_url"];
      let rpc_port = params["rpc_port"];
      let network = params["network"];
      
      try await self.shouldStartHelios(
        pPort: (rpc_port as! Double),
        pUntrustedRpcUrl: (untrusted_rpc_url as! String),
        pConsensusRpcUrl: (consensus_rpc_url as! String),
        pNetwork: (network as! String)
      );
      
      return;
    }
  }

  @available(iOS 13.0.0, *)
  @objc func shutdown(_ params:NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    resolveOrReject(resolve: resolve, reject: reject) {
      let rpc_port = params["rpc_port"];
      try await self.shouldStopHelios(pPort: params["rpc_port"] as! Double);
      return;
    }
  }

}
