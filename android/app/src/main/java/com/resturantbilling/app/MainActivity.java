package com.resturantbilling.app;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * MainActivity — extends Capacitor's BridgeActivity to add:
 *  1. Runtime Bluetooth permission requests (Android 6–15+)
 *  2. WebChromeClient that auto-grants Web Bluetooth permission requests
 *  3. Automatic permission requests on launch for thermal printer pairing
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "MehfilPOS";
    private static final int BT_PERMISSION_REQUEST_CODE = 1001;
    private static final int BT_ENABLE_REQUEST_CODE = 1002;
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1003;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate — requesting Bluetooth permissions");

        // Install WebChromeClient on the Capacitor WebView for Web Bluetooth
        // Request all required Bluetooth + location permissions on launch
        requestBluetoothPermissions();
    }

    /**
     * Finds the Capacitor WebView and installs a WebChromeClient that
     * automatically grants Web Bluetooth / USB / HID permission requests
     * from the web app (navigator.bluetooth.requestDevice).
     */
    private void installWebBluetoothChromeClient() {
        try {
            WebView webView = findWebView(getWindow().getDecorView());
            if (webView == null) {
                Log.w(TAG, "WebView not found yet — will retry on resume");
                return;
            }

            // Enable DOM storage, JavaScript, mixed content, etc.
            WebSettings ws = webView.getSettings();
            ws.setJavaScriptEnabled(true);
            ws.setDomStorageEnabled(true);
            ws.setAllowFileAccess(true);
            ws.setMediaPlaybackRequiresUserGesture(false);

            // Install a WebChromeClient that auto-grants permission requests
            webView.setWebChromeClient(new WebChromeClient() {
                /**
                 * Called when the web page requests permissions (e.g. Web Bluetooth,
                 * Web USB, camera, microphone). We auto-grant all requests so that
                 * thermal printer pairing via navigator.bluetooth works seamlessly.
                 */
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    Log.d(TAG, "WebChromeClient.onPermissionRequest — granting: "
                        + String.join(", ", request.getResources()));

                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            request.grant(request.getResources());
                        }
                    });
                }

                /**
                 * Open external links in the system browser instead of inside WebView.
                 */
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog,
                        boolean isUserGesture, android.os.Message resultMsg) {
                    return false;
                }
            });

            Log.d(TAG, "WebChromeClient installed for Web Bluetooth support");
        } catch (Exception e) {
            Log.e(TAG, "Failed to install WebChromeClient", e);
        }
    }

    /**
     * Walk the view hierarchy to find the Capacitor WebView instance.
     */
    private WebView findWebView(View view) {
        if (view instanceof WebView) {
            return (WebView) view;
        }
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    /**
     * Build the list of permissions needed for Bluetooth thermal printer
     * support across all Android versions (6 through 15+).
     */
    private void requestBluetoothPermissions() {
        List<String> needed = new ArrayList<>();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ (SDK 31+): new granular Bluetooth permissions
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH_CONNECT);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH_SCAN);
            }
        } else {
            // Android 6–11: legacy Bluetooth + location for scanning
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADMIN)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH_ADMIN);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.ACCESS_FINE_LOCATION);
            }
        }

        if (!needed.isEmpty()) {
            Log.d(TAG, "Requesting " + needed.size() + " Bluetooth permissions");
            ActivityCompat.requestPermissions(this,
                needed.toArray(new String[0]), BT_PERMISSION_REQUEST_CODE);
        } else {
            Log.d(TAG, "All Bluetooth permissions already granted");
            ensureBluetoothEnabled();
        }
    }

    /**
     * After permissions are granted, try to enable the Bluetooth adapter
     * if it's currently disabled (shows the system enable-BT dialog).
     */
    private void ensureBluetoothEnabled() {
        try {
            BluetoothManager btManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
            if (btManager != null) {
                BluetoothAdapter adapter = btManager.getAdapter();
                if (adapter != null && !adapter.isEnabled()) {
                    Intent enableBt = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
                    if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT)
                            == PackageManager.PERMISSION_GRANTED) {
                        startActivityForResult(enableBt, BT_ENABLE_REQUEST_CODE);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Could not check Bluetooth adapter state", e);
        }
    }

    /**
     * Handle the result of runtime permission requests.
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == BT_PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (allGranted) {
                Log.d(TAG, "All Bluetooth permissions granted");
                Toast.makeText(this, "✅ Bluetooth permissions granted", Toast.LENGTH_SHORT).show();
                ensureBluetoothEnabled();
            } else {
                Log.w(TAG, "Some Bluetooth permissions denied");
                Toast.makeText(this,
                    "⚠️ Bluetooth permissions needed for thermal printer pairing",
                    Toast.LENGTH_LONG).show();

                // Show a dialog explaining why permissions are needed
                new AlertDialog.Builder(this)
                    .setTitle("Bluetooth Permissions Required")
                    .setMessage(
                        "To pair thermal Bluetooth printers, the app needs:\n\n" +
                        "• Bluetooth Connect — pair with printer\n" +
                        "• Bluetooth Scan — discover printers\n" +
                        "• Location — required for BLE scanning\n\n" +
                        "Please grant these in Settings if denied.")
                    .setPositiveButton("Open Settings", (dialog, which) -> {
                        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.fromParts("package", getPackageName(), null));
                        startActivity(intent);
                    })
                    .setNegativeButton("Later", null)
                    .show();
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-install WebChromeClient after activity resumes (WebView may be recreated)
        installWebBluetoothChromeClient();
    }
}
