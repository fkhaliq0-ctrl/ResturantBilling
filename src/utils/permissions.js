// Permission Handling Utility for Capacitor Android
// Handles runtime permission requests for Location and Bluetooth

// Check if running in native environment
const isNative = typeof window !== 'undefined' && window.cordova;

// Permission types we need
const REQUIRED_PERMISSIONS = {
  BLUETOOTH: 'android.permission.BLUETOOTH',
  BLUETOOTH_ADMIN: 'android.permission.BLUETOOTH_ADMIN',
  BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
  BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
  ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
};

// Mock implementation for web/desktop
const mockPermissions = {
  requestPermissions: async () => {
    console.log('[Permissions] Running in web/desktop - permissions not required');
    return { granted: true };
  },
  checkPermissions: async () => {
    console.log('[Permissions] Running in web/desktop - assuming permissions granted');
    return { granted: true };
  }
};

// Real implementation for Android
let androidPermissions = null;

async function getAndroidPermissions() {
  if (androidPermissions) return androidPermissions;
  
  try {
    if (isNative && window.cordova && window.cordova.plugins && window.cordova.plugins.diagnostic) {
      androidPermissions = window.cordova.plugins.diagnostic;
      return androidPermissions;
    }
  } catch (error) {
    console.error('[Permissions] Failed to load Android permissions plugin:', error);
  }
  
  return mockPermissions;
}

// Request specific permissions
export async function requestPermission(permission) {
  try {
    const permissions = await getAndroidPermissions();
    
    if (!isNative) {
      return { granted: true, message: 'Not running on Android' };
    }
    
    // For Android 12+ (API 31+), use the new permission model
    if (permissions.requestRuntimePermission) {
      const result = await permissions.requestRuntimePermission(permission);
      return {
        granted: result === 'GRANTED',
        status: result,
        message: result === 'GRANTED' ? 'Permission granted' : 'Permission denied'
      };
    }
    
    // Fallback for older Android versions
    if (permissions.requestPermissions) {
      const result = await permissions.requestPermissions([permission]);
      return {
        granted: result[permission] === 'GRANTED',
        status: result[permission],
        message: result[permission] === 'GRANTED' ? 'Permission granted' : 'Permission denied'
      };
    }
    
    return { granted: true, message: 'Permission check not available' };
  } catch (error) {
    console.error('[Permissions] Error requesting permission:', error);
    return { granted: false, error: error.message };
  }
}

// Check if permission is granted
export async function checkPermission(permission) {
  try {
    const permissions = await getAndroidPermissions();
    
    if (!isNative) {
      return { granted: true, message: 'Not running on Android' };
    }
    
    if (permissions.getPermissionAuthorizationStatus) {
      const status = await permissions.getPermissionAuthorizationStatus(permission);
      return {
        granted: status === 'GRANTED',
        status: status,
        message: status === 'GRANTED' ? 'Permission granted' : 'Permission not granted'
      };
    }
    
    return { granted: true, message: 'Permission check not available' };
  } catch (error) {
    console.error('[Permissions] Error checking permission:', error);
    return { granted: false, error: error.message };
  }
}

// Request all required permissions
export async function requestRequiredPermissions() {
  console.log('[Permissions] Requesting required permissions...');
  
  if (!isNative) {
    console.log('[Permissions] Not running on Android - skipping permission requests');
    return { success: true, message: 'Not running on Android' };
  }
  
  const results = {};
  let allGranted = true;
  
  // Request location permissions
  try {
    const fineLocation = await requestPermission(REQUIRED_PERMISSIONS.ACCESS_FINE_LOCATION);
    const coarseLocation = await requestPermission(REQUIRED_PERMISSIONS.ACCESS_COARSE_LOCATION);
    
    results.location = {
      fine: fineLocation,
      coarse: coarseLocation,
      granted: fineLocation.granted && coarseLocation.granted
    };
    
    if (!results.location.granted) {
      allGranted = false;
      console.warn('[Permissions] Location permissions not fully granted');
    }
  } catch (error) {
    console.error('[Permissions] Error requesting location permissions:', error);
    results.location = { error: error.message, granted: false };
    allGranted = false;
  }
  
  // Request Bluetooth permissions
  try {
    const bluetooth = await requestPermission(REQUIRED_PERMISSIONS.BLUETOOTH);
    const bluetoothAdmin = await requestPermission(REQUIRED_PERMISSIONS.BLUETOOTH_ADMIN);
    
    results.bluetooth = {
      basic: bluetooth,
      admin: bluetoothAdmin,
      granted: bluetooth.granted && bluetoothAdmin.granted
    };
    
    if (!results.bluetooth.granted) {
      allGranted = false;
      console.warn('[Permissions] Bluetooth permissions not fully granted');
    }
    
    // For Android 12+, also request new Bluetooth permissions
    try {
      const bluetoothConnect = await requestPermission(REQUIRED_PERMISSIONS.BLUETOOTH_CONNECT);
      const bluetoothScan = await requestPermission(REQUIRED_PERMISSIONS.BLUETOOTH_SCAN);
      
      results.bluetooth.connect = bluetoothConnect;
      results.bluetooth.scan = bluetoothScan;
      results.bluetooth.granted = results.bluetooth.granted && bluetoothConnect.granted && bluetoothScan.granted;
    } catch (_e) {
      console.log('[Permissions] New Bluetooth permissions not available (Android < 12)');
    }
  } catch (error) {
    console.error('[Permissions] Error requesting Bluetooth permissions:', error);
    results.bluetooth = { error: error.message, granted: false };
    allGranted = false;
  }
  
  return {
    success: allGranted,
    results: results,
    message: allGranted ? 'All permissions granted' : 'Some permissions were denied'
  };
}

// Check all required permissions
export async function checkRequiredPermissions() {
  console.log('[Permissions] Checking required permissions...');
  
  if (!isNative) {
    return { success: true, message: 'Not running on Android' };
  }
  
  const results = {};
  let allGranted = true;
  
  // Check location permissions
  try {
    const fineLocation = await checkPermission(REQUIRED_PERMISSIONS.ACCESS_FINE_LOCATION);
    const coarseLocation = await checkPermission(REQUIRED_PERMISSIONS.ACCESS_COARSE_LOCATION);
    
    results.location = {
      fine: fineLocation,
      coarse: coarseLocation,
      granted: fineLocation.granted && coarseLocation.granted
    };
    
    if (!results.location.granted) {
      allGranted = false;
    }
  } catch (error) {
    console.error('[Permissions] Error checking location permissions:', error);
    results.location = { error: error.message, granted: false };
    allGranted = false;
  }
  
  // Check Bluetooth permissions
  try {
    const bluetooth = await checkPermission(REQUIRED_PERMISSIONS.BLUETOOTH);
    const bluetoothAdmin = await checkPermission(REQUIRED_PERMISSIONS.BLUETOOTH_ADMIN);
    
    results.bluetooth = {
      basic: bluetooth,
      admin: bluetoothAdmin,
      granted: bluetooth.granted && bluetoothAdmin.granted
    };
    
    if (!results.bluetooth.granted) {
      allGranted = false;
    }
    
    // Check new Bluetooth permissions for Android 12+
    try {
      const bluetoothConnect = await checkPermission(REQUIRED_PERMISSIONS.BLUETOOTH_CONNECT);
      const bluetoothScan = await checkPermission(REQUIRED_PERMISSIONS.BLUETOOTH_SCAN);
      
      results.bluetooth.connect = bluetoothConnect;
      results.bluetooth.scan = bluetoothScan;
      results.bluetooth.granted = results.bluetooth.granted && bluetoothConnect.granted && bluetoothScan.granted;
    } catch (e) {
      // These permissions might not exist on older Android versions
    }
  } catch (error) {
    console.error('[Permissions] Error checking Bluetooth permissions:', error);
    results.bluetooth = { error: error.message, granted: false };
    allGranted = false;
  }
  
  return {
    success: allGranted,
    results: results,
    message: allGranted ? 'All permissions granted' : 'Some permissions are missing'
  };
}

// Initialize permissions on app startup
export async function initializePermissions() {
  console.log('[Permissions] Initializing permission system...');
  
  try {
    const status = await checkRequiredPermissions();
    
    if (!status.success) {
      console.warn('[Permissions] Some permissions are missing, requesting...');
      const requestResult = await requestRequiredPermissions();
      
      if (!requestResult.success) {
        console.warn('[Permissions] Some permissions were denied after request');
        // You might want to show a user-friendly message here
      }
    }
    
    return status;
  } catch (error) {
    console.error('[Permissions] Error initializing permissions:', error);
    return { success: false, error: error.message };
  }
}