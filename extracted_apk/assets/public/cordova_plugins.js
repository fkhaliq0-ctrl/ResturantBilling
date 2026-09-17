
  cordova.define('cordova/plugin_list', function(require, exports, module) {
    module.exports = [
      {
          "id": "cordova-plugin-android-permissions.Permissions",
          "file": "plugins/cordova-plugin-android-permissions/www/permissions.js",
          "pluginId": "cordova-plugin-android-permissions",
        "clobbers": [
          "cordova.plugins.permissions"
        ]
        },
      {
          "id": "cordova-plugin-bluetooth-serial.bluetoothSerial",
          "file": "plugins/cordova-plugin-bluetooth-serial/www/bluetoothSerial.js",
          "pluginId": "cordova-plugin-bluetooth-serial",
        "clobbers": [
          "window.bluetoothSerial"
        ]
        }
    ];
    module.exports.metadata =
    // TOP OF METADATA
    {
      "cordova-plugin-android-permissions": "1.1.5",
      "cordova-plugin-bluetooth-serial": "0.4.7"
    };
    // BOTTOM OF METADATA
    });
    