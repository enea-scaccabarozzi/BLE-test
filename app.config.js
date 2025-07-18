const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: IS_DEV ? "Life2M (Dev)" : "Life2M",
    slug: "Life2M",
    owner: "get_switch",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "life2m",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? "dev.getswitch.life2m" : "eu.life2m.app",
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      targetSdkVersion: 35,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
      ],
      package: IS_DEV ? "dev.getswitch.life2m" : "com.getswitch.life2m",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "react-native-ble-plx",
        {
          isBackgroundEnabled: true,
          modes: ["peripheral", "central"],
          bluetoothAlwaysPermission:
            "Allow $(PRODUCT_NAME) to connect to bluetooth devices in order to communicate with your vehicle.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow $(PRODUCT_NAME) to access your camera in order to scan QR codes.",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true,
          faceIDPermission:
            "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location in order to provide location-based features and keep track of your vehicle.",
          locationAlwaysPermission:
            "Allow $(PRODUCT_NAME) to use your location even when the app is closed to provide continuous vehicle tracking and safety features.",
          locationWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location when the app is in use to provide location-based features.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "expo-task-manager",
        {
          // Configuration for background tasks
        },
      ],
      "expo-router",
      "expo-asset",
      "expo-secure-store",
    ],
    extra: {
      eas: {
        projectId: "1a415e7e-3794-4d99-ac4d-18fe85700951",
      },
    },
  },
};
