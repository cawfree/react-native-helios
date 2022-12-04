package com.helios;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import com.facebook.react.bridge.ReadableMap;

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = HeliosModule.NAME)
public class HeliosModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("helios");
  }

  public static final String NAME = "Helios";
  private static Map<String, Helios> INSTANCES = new HashMap();

  public HeliosModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  public void start(ReadableMap params, Promise promise) {

    //new Thread(new Runnable() {
    //  @Override
    //  public void run() {
        Helios helios = new Helios();

        // TODO: consider launching this from a thread instead
        helios.heliosStart(
          params.getString("untrusted_rpc_url"),
          params.getString("consensus_rpc_url")
        );

        // TODO: get block number next

        // Ensure we escape garbage collection.
        INSTANCES.put("default", helios);

        promise.resolve("");
      }
  //  }).start();
  //}

  @ReactMethod
  public void trySomething(Promise promise) {
    Helios x = INSTANCES.get("default");
    promise.resolve(x.heliosGetBlockNumber());
  }

}
