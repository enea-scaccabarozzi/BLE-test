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
import { AppResult, AppResultAsync } from "@app/shared/types/errors";

global.Buffer = require("buffer").Buffer;

export const useBleService = () => {
  const [manager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // const _DEVICE_NAME = "SIL02112A";
  const _SERVICE_UUID = "1d5688de-866d-3aa4-ec46-a1bddb37ecf6";
  const _CHARACTERISTIC_UUID = "af20fbac-2518-4998-9af7-af42540731b3";

  const _isValidDeviceName = (name: string | null | undefined) => {
    // name should start with "SIL"
    return name?.startsWith("SIL") ?? false;
  };

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

  const scanAndConnect = useCallback((): AppResultAsync<Device> => {
    const promise = new Promise<Device>((resolve, reject) => {
      const subscription = manager.onStateChange((state) => {
        if (state === "PoweredOn") {
          manager.startDeviceScan(null, null, async (error, device) => {
            console.log(device?.name);
            if (error) {
              reject(new Error(`Device scan failed: ${error.message}`));
              return;
            }

            if (
              device &&
              (_isValidDeviceName(device.name) ||
                _isValidDeviceName(device.localName))
            ) {
              manager.stopDeviceScan();

              try {
                await device.connect({ timeout: 15000 });

                await device.discoverAllServicesAndCharacteristics();

                console.log("Connected to device and discovered services");

                const isConnected = await device.isConnected();

                console.log(`Connected: ${isConnected}`);

                setConnectedDevice(device); // Store the connected device in state

                console.log("Connected!");
                resolve(device);
              } catch (error) {
                setConnectedDevice(null); // Ensure connected device is cleared on failure
                if (error instanceof Error) {
                  reject(
                    new Error(`Device connection failed: ${error.message}`),
                  );
                } else {
                  reject(new Error("Device connection failed"));
                }
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
      .map((device) => device)
      .mapErr((error) => {
        console.log(error);
        return error instanceof Error
          ? createAppError({ publicMessage: error.message })
          : createAppError({
              publicMessage: "Device scan or connection failed",
            });
      });
  }, [manager]);

  const requestDataMesuraments = useCallback(
    (device: Device | undefined): AppResultAsync<DataMeasurements> => {
      let receivedChunks: string[] = [];
      let totalBytesExpected = -1;
      let lastChunkTime = Date.now();
      let completed: Uint8Array | null = null;

      console.log("Starting requestDataMesuraments...");
      const connected = device || connectedDevice;

      if (!connected)
        return appErrAsync({
          publicMessage: "Unable to request data, no connected device",
        });

      return okAsync(true)
        .andThrough(() =>
          fromPromise(
            connected.connect({ timeout: 15000, autoConnect: true }),
            (err) => {
              console.log("Connection error:", err);
              return createAppError({
                publicMessage: "Unable to connect, connection failed",
              });
            },
          ),
        )
        .andTee(() => console.log("Connected to device"))
        .andThrough(() =>
          fromPromise(
            connected.discoverAllServicesAndCharacteristics(),
            (err) => {
              console.log("Discovery error:", err);
              return createAppError({
                publicMessage: "Unable to connect, unalbe to discover",
              });
            },
          ),
        )
        .andTee(() => console.log("Discovered services"))
        .andThrough(() =>
          fromPromise(
            new Promise<void>(async (resolve, reject) => {
              let remainingAttempts = 10;

              while (remainingAttempts > 0) {
                if (!isLocked) {
                  resolve();
                  return;
                }

                await new Promise((res) => setTimeout(res, 100));

                remainingAttempts--;
              }

              reject(new Error("Device is locked"));
            }),
            () => {
              console.log("Device is locked");
              return createAppError({
                publicMessage:
                  "Unable to request data, device is already locked",
              });
            },
          ),
        )
        .andTee(() => console.log("Device is unlocked"))
        .andTee(() =>
          connected.monitorCharacteristicForService(
            _SERVICE_UUID,
            _CHARACTERISTIC_UUID,
            async (error, characteristic) => {
              if (error) {
                console.log("Error monitoring characteristic:", error.message);
              }

              setIsLocked(true);

              if (characteristic?.value) {
                const chunk = Buffer.from(characteristic.value, "base64");
                console.log("Received chunk:", chunk.toString("base64"));
                if (totalBytesExpected === -1) {
                  totalBytesExpected = chunk[0];
                  console.log(
                    "Recived new message with length:",
                    totalBytesExpected,
                  );
                }

                receivedChunks.push(chunk.toString("base64"));
                lastChunkTime = Date.now();

                const elapsedTime = Date.now() - lastChunkTime;
                const receivedBytes = receivedChunks.reduce(
                  (sum, chunk) => sum + Buffer.from(chunk, "base64").length,
                  0,
                );
                console.log(
                  `Received ${receivedBytes} / ${totalBytesExpected} bytes. Elapsed time: ${elapsedTime} ms`,
                );

                if (receivedBytes >= totalBytesExpected) {
                  console.log("All chunks received. Processing data...");

                  console.log("Chunks:", receivedChunks);

                  const completedMessage = Buffer.concat(
                    receivedChunks.map((chunk) => Buffer.from(chunk, "base64")),
                  );

                  console.log(
                    "Complete message:",
                    completedMessage.toString("base64"),
                  );

                  const ui8Array = new Uint8Array(completedMessage);

                  console.log("UI8Array:", ui8Array);

                  completed = ui8Array;
                }
              }
            },
          ),
        )
        .andTee(() => console.log("Monitoring characteristic..."))
        .andThrough(() =>
          generateCommandPayload(BMSCommandType.DATA_MEASUREMENTS)
            .map((payload) => Buffer.from(payload).toString("base64"))
            .andTee((payload) => console.log("Payload:", payload))
            .asyncAndThen((payload) =>
              fromPromise(
                connected.writeCharacteristicWithResponseForService(
                  _SERVICE_UUID,
                  _CHARACTERISTIC_UUID,
                  payload,
                ),
                (err) => {
                  console.log("Write error:", err);
                  return createAppError({
                    publicMessage:
                      "Unable to request data, characteristic unwritable",
                  });
                },
              ),
            ),
        )
        .andTee(() => console.log("Sent request for data"))
        .andThen(() =>
          fromPromise(
            new Promise<AppResult<DataMeasurements>>(
              async (resolve, reject) => {
                const now = Date.now();
                const timeout = 10_000;

                while (!completed) {
                  await new Promise((res) => setTimeout(res, 100));
                  if (Date.now() - now > timeout) {
                    setIsLocked(false);
                    reject(new Error("Request data timeout"));

                    return;
                  }
                }

                setIsLocked(false);
                resolve(
                  // eslint-disable-next-line neverthrow/must-use-result
                  parseResponse(completed, BMSCommandType.DATA_MEASUREMENTS),
                );
              },
            ),
            (err) => {
              const error = err as Error;
              console.log("Unable to read data:", error.message);
              return createAppError({
                publicMessage: "Unable to request data, unable to read data",
              });
            },
          ),
        )
        .andThen((data) => data)
        .andTee((parsed) => console.log("Parsed data:", parsed))
        .map((data) => data)
        .mapErr((err) => {
          console.log("Error:", err);
          return err;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connectedDevice],
  );

  const toggleMosfet = useCallback(
    (
      targetMosfetStatus: boolean,
      device: Device | undefined,
    ): AppResultAsync<boolean> => {
      let receivedChunks: string[] = [];
      let totalBytesExpected = -1;
      let lastChunkTime = Date.now();
      let completed: Uint8Array | null = null;

      console.log(`Starting toggleMosfet to ${targetMosfetStatus}...`);
      const connected = device || connectedDevice;

      if (!connected)
        return appErrAsync({
          publicMessage: "Unable to request data, no connected device",
        });

      return okAsync(true)
        .andThrough(() =>
          fromPromise(
            connected.connect({ timeout: 15000, autoConnect: true }),
            (err) => {
              console.log("Connection error:", err);
              return createAppError({
                publicMessage: "Unable to connect, connection failed",
              });
            },
          ),
        )
        .andTee(() => console.log("Connected to device"))
        .andThrough(() =>
          fromPromise(
            connected.discoverAllServicesAndCharacteristics(),
            (err) => {
              console.log("Discovery error:", err);
              return createAppError({
                publicMessage: "Unable to connect, unalbe to discover",
              });
            },
          ),
        )
        .andTee(() => console.log("Discovered services"))
        .andThrough(() =>
          fromPromise(
            new Promise<void>(async (resolve, reject) => {
              let remainingAttempts = 10;

              while (remainingAttempts > 0) {
                if (!isLocked) {
                  resolve();
                  return;
                }

                await new Promise((res) => setTimeout(res, 100));

                remainingAttempts--;
              }

              reject(new Error("Device is locked"));
            }),
            () => {
              console.log("Device is locked");
              return createAppError({
                publicMessage:
                  "Unable to request data, device is already locked",
              });
            },
          ),
        )
        .andTee(() => console.log("Device is unlocked"))
        .andTee(() =>
          connected.monitorCharacteristicForService(
            _SERVICE_UUID,
            _CHARACTERISTIC_UUID,
            async (error, characteristic) => {
              if (error) {
                console.log("Error monitoring characteristic:", error.message);
              }

              setIsLocked(true);

              if (characteristic?.value) {
                const chunk = Buffer.from(characteristic.value, "base64");
                console.log("Received chunk:", chunk.toString("base64"));
                if (totalBytesExpected === -1) {
                  totalBytesExpected = chunk[0];
                  console.log(
                    "Recived new message with length:",
                    totalBytesExpected,
                  );
                }

                receivedChunks.push(chunk.toString("base64"));
                lastChunkTime = Date.now();

                const elapsedTime = Date.now() - lastChunkTime;
                const receivedBytes = receivedChunks.reduce(
                  (sum, chunk) => sum + Buffer.from(chunk, "base64").length,
                  0,
                );
                console.log(
                  `Received ${receivedBytes} / ${totalBytesExpected} bytes. Elapsed time: ${elapsedTime} ms`,
                );

                if (receivedBytes >= totalBytesExpected) {
                  console.log("All chunks received. Processing data...");

                  console.log("Chunks:", receivedChunks);

                  const completedMessage = Buffer.concat(
                    receivedChunks.map((chunk) => Buffer.from(chunk, "base64")),
                  );

                  console.log(
                    "Complete message:",
                    completedMessage.toString("base64"),
                  );

                  const ui8Array = new Uint8Array(completedMessage);

                  console.log("UI8Array:", ui8Array);

                  completed = ui8Array;
                }
              }
            },
          ),
        )
        .andTee(() => console.log("Monitoring characteristic..."))
        .andThrough(() =>
          generateCommandPayload(
            targetMosfetStatus
              ? BMSCommandType.MOSFET_ON
              : BMSCommandType.MOSFET_OFF,
          )
            .map((payload) => Buffer.from(payload).toString("base64"))
            .andTee((payload) => console.log("Payload:", payload))
            .asyncAndThen((payload) =>
              fromPromise(
                connected.writeCharacteristicWithResponseForService(
                  _SERVICE_UUID,
                  _CHARACTERISTIC_UUID,
                  payload,
                ),
                (err) => {
                  console.log("Write error:", err);
                  return createAppError({
                    publicMessage:
                      "Unable to request data, characteristic unwritable",
                  });
                },
              ),
            ),
        )
        .andThrough(() =>
          fromSafePromise(new Promise((res) => setTimeout(res, 1000))),
        )
        .andThrough(() =>
          generateCommandPayload(BMSCommandType.DATA_MEASUREMENTS)
            .map((payload) => Buffer.from(payload).toString("base64"))
            .andTee((payload) => console.log("Payload:", payload))
            .asyncAndThen((payload) =>
              fromPromise(
                connected.writeCharacteristicWithResponseForService(
                  _SERVICE_UUID,
                  _CHARACTERISTIC_UUID,
                  payload,
                ),
                (err) => {
                  console.log("Write error:", err);
                  return createAppError({
                    publicMessage:
                      "Unable to request data, characteristic unwritable",
                  });
                },
              ),
            ),
        )
        .andTee(() => console.log("Sent request for data"))
        .andThen(() =>
          fromPromise(
            new Promise<AppResult<DataMeasurements>>(
              async (resolve, reject) => {
                const now = Date.now();
                const timeout = 10_000;

                while (!completed) {
                  await new Promise((res) => setTimeout(res, 100));
                  if (Date.now() - now > timeout) {
                    setIsLocked(false);
                    reject(new Error("Request data timeout"));

                    return;
                  }
                }

                setIsLocked(false);
                resolve(
                  // eslint-disable-next-line neverthrow/must-use-result
                  parseResponse(completed, BMSCommandType.DATA_MEASUREMENTS),
                );
              },
            ),
            (err) => {
              const error = err as Error;
              console.log("Unable to read data:", error.message);
              return createAppError({
                publicMessage: "Unable to request data, unable to read data",
              });
            },
          ),
        )
        .andThen((data) => data)
        .andTee((parsed) => console.log("Parsed data:", parsed))
        .map((data) =>
          targetMosfetStatus ? data.flgBms.mosfetOn : !data.flgBms.mosfetOn,
        )
        .mapErr((err) => {
          console.log("Error:", err);
          return err;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connectedDevice],
  );

  const disconnect = useCallback((): AppResultAsync<true> => {
    if (connectedDevice) {
      connectedDevice.cancelConnection();
      setConnectedDevice(null); // Clear the connected device on disconnect
      return okAsync(true as const);
    }

    return okAsync(true as const);
  }, [connectedDevice]);

  return {
    scanAndConnect,
    requestPermissions,
    requestDataMesuraments,
    disconnect,
    connectedDevice,
    toggleMosfet,
  };
};
