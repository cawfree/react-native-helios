package com.helios

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import android.util.Log
import com.facebook.react.bridge.ReadableMap

class HeliosModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun start(params: ReadableMap, promise: Promise) {
    promise.resolve(start(params.getString("untrusted_rpc_url")!!, params.getString("consensus_rpc_url")!!))
  }

  companion object {
    const val NAME = "Helios"

    init {
      System.loadLibrary("helios");
    }
  }
}
