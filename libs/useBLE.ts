import * as ExpoDevice from "expo-device";
import { useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleManager,
  Device,
  Service,
  Characteristic,
} from "react-native-ble-plx";

const bleManager = new BleManager();

function useBLE() {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [servicesWithCharacteristics, setServicesWithCharacteristics] =
    useState<{ service: Service; characteristics: Characteristic[] }[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const bluetoothPermissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(bluetoothPermissions).every(
          (value) => value === PermissionsAndroid.RESULTS.GRANTED,
        );
      }
    }
    return true;
  };

  const scanForPeripherals = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        return;
      }

      // Filter out devices that don't have a name or localName
      if (device && (device.name || device.localName)) {
        // Ensure no duplicates and device has a name
        if (!allDevices.some((d) => d.id === device.id)) {
          setAllDevices((prevDevices) => [...prevDevices, device]);
        }
      }
    });
  };

  const connectToDevice = async (device: Device) => {
    try {
      const connected = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connected);
      await connected.discoverAllServicesAndCharacteristics();
      setStatusMessage(`Connected to ${device.name}`);

      // Discover services and characteristics
      const services = await connected.services();
      const serviceCharacteristicPairs = [];

      for (const service of services) {
        const characteristics = await connected.characteristicsForService(
          service.uuid,
        );
        serviceCharacteristicPairs.push({ service, characteristics });
      }

      setServicesWithCharacteristics(serviceCharacteristicPairs);
      bleManager.stopDeviceScan();
    } catch (e) {
      console.log("Connection error:", e);
    }
  };

  return {
    allDevices,
    connectedDevice,
    servicesWithCharacteristics,
    scanForPeripherals,
    connectToDevice,
    requestPermissions,
    statusMessage,
  };
}

export default useBLE;
