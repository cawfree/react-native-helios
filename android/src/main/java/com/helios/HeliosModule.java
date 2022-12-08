package com.helios;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import com.facebook.react.bridge.ReadableMap;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;


@ReactModule(name = HeliosModule.NAME)
public class HeliosModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("helios");
  }

  public static final String NAME = "Helios";
  private static Map<String, Helios> INSTANCES = new HashMap();
  private static ExecutorService EXECUTOR = Executors.newFixedThreadPool(1);

  public HeliosModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void start(ReadableMap params, Promise promise) {
    Double rpc_port = params.getDouble("rpc_port");
    String key = rpc_port.toString();

    Helios helios = new Helios();

    EXECUTOR.execute(new Runnable() { @Override public void run() {
      helios.heliosStart(
        params.getString("untrusted_rpc_url"),
        params.getString("consensus_rpc_url"),
        rpc_port,
        params.getString("network")
      );

      INSTANCES.put(key, helios);
      promise.resolve("");
    } });
  }

  @ReactMethod
    public void shutdown(ReadableMap params, Promise promise) {
      Double rpc_port = params.getDouble("rpc_port");
      String key = rpc_port.toString();

      Helios helios = INSTANCES.get(key);

      EXECUTOR.execute(new Runnable() { @Override public void run() {
          helios.heliosShutdown();

          INSTANCES.remove(key);
          promise.resolve("");
        } });
      }

}
