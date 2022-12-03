package com.helios;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import com.facebook.react.bridge.ReadableMap;

@ReactModule(name = HeliosModule.NAME)
public class HeliosModule extends ReactContextBaseJavaModule {
  static { System.loadLibrary("helios"); }

  public static final String NAME = "Helios";

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
    Helios s = new Helios();

    int x = s.addAnd1(3);

    //params.getString("untrusted_rpc_url")
    //params.getString("consensus_rpc_url")
    promise.resolve("helios is "+x);
  }
}
