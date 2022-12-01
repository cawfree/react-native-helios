package com.helios

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import android.util.Log

class HeliosModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  fun start(a: Double, b: Double, promise: Promise) {
    Log.d("cawfree", start("calling hello direct"))

    promise.resolve(a * b)
  }

  companion object {
    const val NAME = "Helios"

    init {
      System.loadLibrary("helios");
    }
  }
}
