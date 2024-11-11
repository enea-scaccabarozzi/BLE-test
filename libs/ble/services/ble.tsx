import * as ExpoDevice from "expo-device";
import { fromPromise, fromSafePromise, ok, okAsync } from "neverthrow";
import { useState, useCallback } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import {
  BMSCommandType,
  DataMeasurements,
  generateCommandPayload,
  parseResponse,
} from "@app/bms-protocol";
import { appErr, appErrAsync, createAppError } from "@app/shared/errors";
import { AppResultAsync } from "@app/shared/types/errors";

export const useBleService = () => {
  const [manager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const _DEVICE_NAME = "";
  const _SERVICE_UUID = "";
  const _CHARACTERISTIC_UUID = "";

  const requestPermissions = (): AppResultAsync<true> => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        return fromSafePromise(
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message: "Bluetooth Low Energy requires Location",
              buttonPositive: "OK",
            },
          ),
        ).andThen((granted) =>
          granted === PermissionsAndroid.RESULTS.GRANTED
            ? ok(true as const)
            : appErr({
                publicMessage: "Unable to request BLE permissions",
              }),
        );
      } else {
        return fromSafePromise(
          PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]),
        ).andThen((bluetoothPermissions) =>
          Object.values(bluetoothPermissions).every(
            (value) => value === PermissionsAndroid.RESULTS.GRANTED,
          )
            ? ok(true as const)
            : appErr({
                publicMessage: "Unable to request BLE permissions",
              }),
        );
      }
    }
    return okAsync(true as const);
  };

  const scanAndConnect = useCallback((): AppResultAsync<true> => {
    const promise = new Promise((resolve, reject) => {
      const subscription = manager.onStateChange((state) => {
        if (state === "PoweredOn") {
          manager.startDeviceScan(null, null, async (error, device) => {
            if (error) {
              reject(new Error(`Device scan failed: ${error.message}`));
              return;
            }

            if (
              device &&
              (device.name === _DEVICE_NAME ||
                device.localName === _DEVICE_NAME)
            ) {
              manager.stopDeviceScan();

              try {
                const connected = await device
                  .connect({ timeout: 15000 })
                  .then((d) => d.discoverAllServicesAndCharacteristics());
                setConnectedDevice(connected);
                resolve(connected);
              } catch (error) {
                if (error instanceof Error)
                  reject(
                    new Error(`Device connection failed: ${error.message}`),
                  );

                reject(new Error("Device connection failed"));
              }
            }
          });
        }
      }, true);

      setTimeout(() => {
        manager.stopDeviceScan();
        reject(
          new Error(
            "Device scan timed out. Please make sure the device is nearby and powered on",
          ),
        );
      }, 15000);

      return () => subscription.remove();
    });

    return fromPromise(promise, (err) => err)
      .map(() => true as const)
      .mapErr((error) =>
        error instanceof Error
          ? createAppError({ publicMessage: error.message })
          : createAppError({
              publicMessage: "Device scan or connection failed",
            }),
      );
  }, [manager]);

  const requestDataMesuraments =
    useCallback((): AppResultAsync<DataMeasurements> => {
      if (!connectedDevice) {
        return appErrAsync({
          publicMessage: "Unable to request data, no connected device",
        });
      }

      return generateCommandPayload(BMSCommandType.DATA_MEASUREMENTS)
        .asyncAndThen((payload) =>
          fromPromise(
            connectedDevice.writeCharacteristicWithResponseForService(
              _SERVICE_UUID,
              _CHARACTERISTIC_UUID,
              Buffer.from(payload).toString("base64"),
            ),
            () =>
              createAppError({
                publicMessage:
                  "Unable to request data, characteristic unreachable",
              }),
          ).map(
            (characteristic) =>
              characteristic.value &&
              Buffer.from(characteristic.value, "base64"),
          ),
        )
        .andThen((response) =>
          !response
            ? appErr({
                publicMessage: "Unable to request data, no response",
              })
            : ok(new Uint8Array(response)),
        )
        .andThen((response) =>
          parseResponse(response, BMSCommandType.DATA_MEASUREMENTS),
        );
    }, [connectedDevice]);

  const disconnect = useCallback((): AppResultAsync<true> => {
    if (connectedDevice) {
      connectedDevice.cancelConnection();
      setConnectedDevice(null);
      return okAsync(true as const);
    }

    return okAsync(true as const);
  }, [connectedDevice]);

  return {
    scanAndConnect,
    requestPermissions,
    requestDataMesuraments,
    disconnect,
  };
};
