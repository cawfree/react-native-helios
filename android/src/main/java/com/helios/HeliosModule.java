package com.helios;

import android.app.Activity;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import com.facebook.react.bridge.ReadableMap;

import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;


@ReactModule(name = HeliosModule.NAME)
public class HeliosModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("helios");
  }

  private interface RunnableWithException {
    void run() throws Exception;
  }

  public static final String NAME = "Helios";

  private static Map<String, Helios> INSTANCES = new HashMap();

  private static ExecutorService EXECUTOR = Executors.newFixedThreadPool(1);

  private static final String getKey(final Double pPort) {
    return new Integer(pPort.intValue()).toString();
  }

  private static final void shouldStopHelios(
    final Double pPort
  ) {
    final String key = getKey(pPort);

    final Helios maybeHelios = INSTANCES.get(key);

    if (maybeHelios == null) return;

    maybeHelios.heliosShutdown();

    INSTANCES.remove(key);
  }

  private static final void shouldStartHelios(
    final String pUntrustedRpcUrl,
    final String pConsensusRpcUrl,
    final Double pPort,
    final String pNetwork,
    final String pDataDir,
    final String pCheckpoint
  ) {
    final String key = getKey(pPort);

    final Helios helios = new Helios();

    helios.heliosStart(
      pUntrustedRpcUrl,
      pConsensusRpcUrl,
      pPort,
      pNetwork,
      pDataDir,
      pCheckpoint
    );

    INSTANCES.put(key, helios);
  }

  private static final void resolveOrReject(
    final Activity pActivity,
    final Promise pPromise,
    final RunnableWithException pRunnable
  ) {
    EXECUTOR.execute(() -> {
      try {
        pRunnable.run();
        pActivity.runOnUiThread(() -> pPromise.resolve(0));
      } catch (Exception e) {
        e.printStackTrace();
        pActivity.runOnUiThread(() -> pPromise.reject(e));
      }
    });
  }

  public HeliosModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public final void start(final ReadableMap pReadableMap, final Promise pPromise) {
    final File cacheDir = getCurrentActivity().getCacheDir();

    if (!cacheDir.exists()) cacheDir.mkdirs();

    final String dataDir = cacheDir.getAbsolutePath();

    resolveOrReject(
      getCurrentActivity(),
      pPromise,
      () -> {
        shouldStartHelios(
          pReadableMap.getString("untrusted_rpc_url"),
          pReadableMap.getString("consensus_rpc_url"),
          pReadableMap.getDouble("rpc_port"),
          pReadableMap.getString("network"),
          dataDir,
          pReadableMap.getString("checkpoint")
        );
      }
    );
  }

  @ReactMethod
  public final void shutdown(final ReadableMap pReadableMap, final Promise pPromise) {
    resolveOrReject(
      getCurrentActivity(),
      pPromise,
      () -> {
        shouldStopHelios(pReadableMap.getDouble("rpc_port"));
      }
    );
  }

}
