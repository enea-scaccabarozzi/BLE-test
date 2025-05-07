import * as ExpoDevice from "expo-device";
import { fromPromise, fromSafePromise, ok, okAsync } from "neverthrow";
import { useState, useCallback, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import {
  BMSCommandType,
  DataMeasurements,
  generateCommandPayload,
  parseResponse,
  COF_COMMAND_B64,
  CON_COMMAND_B64,
} from "@app/bms-protocol";
import { appErr, appErrAsync, createAppError } from "@app/shared/errors";
import { AppResultAsync } from "@app/shared/types/errors";

global.Buffer = require("buffer").Buffer;

const manager = new BleManager();

export const useBleService = () => {
  // Create our BLE manager and keep track of a connected device.
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  // Use a ref for our “lock” so that simultaneous operations are serialized.
  const lockRef = useRef<boolean>(false);

  // UUID constants
  const _SERVICE_UUID = "1d5688de-866d-3aa4-ec46-a1bddb37ecf6";
  const _CHARACTERISTIC_UUID = "af20fbac-2518-4998-9af7-af42540731b3";

  const _isValidDeviceName = (
    targetName: string,
    name: string | null | undefined,
  ): boolean => {
    const isScooter = name?.startsWith("SIL-");

    const isWildCardUser = targetName === "SIL-XXX-XXX-XXX";

    if (isScooter) {
      if (isWildCardUser) return true;

      return name === targetName;
    }

    return false;
  };

  // ────────────────────────────────────────────────────────────────
  // PERMISSIONS
  // ────────────────────────────────────────────────────────────────

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

  // ────────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ────────────────────────────────────────────────────────────────

  /**
   * Ensure that the given device is connected and its services discovered.
   */
  const ensureConnectedAndDiscovered = async (
    device: Device,
  ): Promise<void> => {
    const isConnected = await device.isConnected();
    if (!isConnected) {
      await device.connect({ autoConnect: false });
    }
    await device.discoverAllServicesAndCharacteristics();
  };

  /**
   * Monitor a characteristic for notifications.
   * Accumulates incoming chunks (which are assumed to have the first byte as total length)
   * until the complete response is available or until a timeout occurs.
   */
  const monitorResponse = (
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    timeout = 10000,
  ): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      let receivedChunks: string[] = [];
      let totalBytesExpected = -1;
      const subscription = device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.log("Error monitoring characteristic:", error.message);
            // (We log the error and let the timeout eventually reject.)
          }
          if (characteristic?.value) {
            const chunk = Buffer.from(characteristic.value, "base64");
            const chunkB64 = chunk.toString("base64");
            // Ignore special MOSFET responses.
            if (chunkB64 === COF_COMMAND_B64 || chunkB64 === CON_COMMAND_B64) {
              console.log("Received MOSFET response:", chunkB64);
              return;
            }
            if (totalBytesExpected === -1) {
              totalBytesExpected = chunk[0];
              console.log(
                "Recived new response, expected len:",
                totalBytesExpected,
              );
            }
            receivedChunks.push(chunkB64);
            const receivedBytes = receivedChunks.reduce(
              (sum, ch) => sum + Buffer.from(ch, "base64").length,
              0,
            );
            if (receivedBytes >= totalBytesExpected) {
              console.log("All chunks received. Processing data...");
              const completeBuffer = Buffer.concat(
                receivedChunks.map((ch) => Buffer.from(ch, "base64")),
              );
              const responseArray = new Uint8Array(completeBuffer);
              subscription.remove();
              // print base 64
              const base64 = Buffer.from(responseArray).toString("base64");
              console.log("Response complete:", base64);
              resolve(responseArray);
            }
          }
        },
      );
      setTimeout(() => {
        subscription.remove();
        reject(new Error("Response timeout"));
      }, timeout);
    });
  };

  /**
   * Acquire the “lock” (blocking up to a timeout). This prevents two operations
   * (for example, toggling the mosfet and requesting data) from overlapping.
   */
  const acquireLock = async (timeout = 5000, interval = 100): Promise<void> => {
    console.log("Acquiring lock...");
    const start = Date.now();
    while (lockRef.current) {
      if (Date.now() - start > timeout) {
        console.log("Lock acquisition timed out");
        throw new Error("Device is locked");
      }
      await new Promise((res) => setTimeout(res, interval));
    }
    lockRef.current = true;
    console.log("Lock acquired");
  };

  const releaseLock = () => {
    lockRef.current = false;
    console.log("Lock released");
  };

  // ────────────────────────────────────────────────────────────────
  // API METHODS
  // ────────────────────────────────────────────────────────────────

  /**
   * Scan for a device and connect to the first one that has a valid name.
   */
  const scanAndConnect = useCallback(
    (deviceName: string): AppResultAsync<Device> => {
      return fromPromise(manager.state(), () =>
        createAppError({ publicMessage: "Bluetooth state check failed" }),
      )
        .andThen((state) => {
          if (state !== "PoweredOn") {
            return appErrAsync({
              publicMessage: "Bluetooth is not enabled",
            });
          }
          return okAsync(state);
        })
        .andThen(() =>
          fromPromise(
            (async () => {
              const device = await new Promise<Device>((resolve, reject) => {
                manager.startDeviceScan(null, null, async (error, device) => {
                  if (error) {
                    reject(new Error(`Device scan failed: ${error.message}`));
                    return;
                  }
                  if (
                    device &&
                    (_isValidDeviceName(deviceName, device.name) ||
                      _isValidDeviceName(deviceName, device.localName))
                  ) {
                    manager.stopDeviceScan();
                    try {
                      await device.connect({ autoConnect: false });
                      await device.discoverAllServicesAndCharacteristics();
                      console.log(
                        "[scanAndConnect] Connected and discovered services",
                      );
                      setConnectedDevice(device);
                      resolve(device);
                    } catch (error) {
                      setConnectedDevice(null);
                      reject(
                        new Error(
                          `Device connection failed: ${
                            error instanceof Error
                              ? error.message
                              : "Unknown error"
                          }`,
                        ),
                      );
                    }
                  }
                });
                setTimeout(() => {
                  manager.stopDeviceScan();
                  reject(
                    new Error(
                      "Device scan timed out. Please make sure the device is nearby and powered on",
                    ),
                  );
                }, 15000);
              });

              device.onDisconnected(async () => {
                setConnectedDevice(null);
                console.log("Device disconnected");
                console.log(
                  "Devices list:",
                  await manager.connectedDevices([_SERVICE_UUID]),
                );
              });

              device.onDisconnected(() => {});
              return device;
            })(),
            (err) =>
              err instanceof Error
                ? createAppError({ publicMessage: err.message })
                : createAppError({ publicMessage: "Scan and connect failed" }),
          ),
        );
    },
    [],
  );

  /**
   * Request data measurements from the device.
   * This method:
   *   1. Acquires the lock.
   *   2. Ensures the device is connected and its services discovered.
   *   3. Starts monitoring for the response.
   *   4. Sends a DATA_MEASUREMENTS command.
   *   5. Waits for and parses the complete response.
   */
  const requestDataMesuraments = useCallback(
    (device?: Device): AppResultAsync<DataMeasurements> => {
      const connected = device || connectedDevice;
      if (!connected) {
        return appErrAsync({
          publicMessage: "Unable to request data, no connected device",
        });
      }
      return fromPromise(
        (async () => {
          await acquireLock();
          try {
            await ensureConnectedAndDiscovered(connected);
            console.log(
              "[requestDataMesuraments] Connected and discovered services",
            );
            // Start monitoring for the complete response.
            const responsePromise = monitorResponse(
              connected,
              _SERVICE_UUID,
              _CHARACTERISTIC_UUID,
            );
            // Generate and send the DATA_MEASUREMENTS command.
            const payloadResult = generateCommandPayload(
              BMSCommandType.DATA_MEASUREMENTS,
            );
            if (payloadResult.isErr()) {
              throw new Error("Failed to generate command payload");
            }
            const payloadB64 = Buffer.from(payloadResult.value).toString(
              "base64",
            );
            console.log(
              "[requestDataMesuraments] Sending payload:",
              payloadB64,
            );
            await connected.writeCharacteristicWithResponseForService(
              _SERVICE_UUID,
              _CHARACTERISTIC_UUID,
              payloadB64,
            );
            console.log(
              "[requestDataMesuraments] Command sent, awaiting response",
            );
            const response = await responsePromise;
            const parsed = parseResponse(
              response,
              BMSCommandType.DATA_MEASUREMENTS,
            );
            console.log("[requestDataMesuraments] Data parsed");
            return parsed;
          } finally {
            releaseLock();
          }
        })(),
        (err) =>
          err instanceof Error
            ? createAppError({ publicMessage: err.message })
            : createAppError({
                publicMessage: "Unable to request data, operation failed",
              }),
      ).andThen((data) => data);
    },
    [connectedDevice],
  );

  /**
   * Toggle the MOSFET and then request an updated data measurement.
   * The method first sends a MOSFET toggle command then, after a short delay,
   * sends a DATA_MEASUREMENTS command. The response is then parsed to extract
   * the current MOSFET status.
   */
  const toggleMosfet = useCallback(
    (targetMosfetStatus: boolean, device?: Device): AppResultAsync<boolean> => {
      const connected = device || connectedDevice;
      if (!connected) {
        return appErrAsync({
          publicMessage: "Unable to toggle mosfet, no connected device",
        });
      }
      return fromPromise(
        (async () => {
          await acquireLock();
          try {
            await ensureConnectedAndDiscovered(connected);
            console.log("[toggleMosfet] Connected and discovered services");
            // Start monitoring for the response.
            const responsePromise = monitorResponse(
              connected,
              _SERVICE_UUID,
              _CHARACTERISTIC_UUID,
            );
            // Send the toggle command.
            const commandType = targetMosfetStatus
              ? BMSCommandType.MOSFET_ON
              : BMSCommandType.MOSFET_OFF;
            const togglePayloadResult = generateCommandPayload(commandType);
            if (togglePayloadResult.isErr()) {
              throw new Error("Failed to generate toggle command payload");
            }
            const togglePayloadB64 = Buffer.from(
              togglePayloadResult.value,
            ).toString("base64");
            console.log(
              "[toggleMosfet] Sending toggle payload:",
              togglePayloadB64,
            );
            await connected.writeCharacteristicWithResponseForService(
              _SERVICE_UUID,
              _CHARACTERISTIC_UUID,
              togglePayloadB64,
            );
            // Wait a moment before sending the data measurement command.
            await new Promise((res) => setTimeout(res, 1000));
            // Send the DATA_MEASUREMENTS command.
            const dataPayloadResult = generateCommandPayload(
              BMSCommandType.DATA_MEASUREMENTS,
            );
            if (dataPayloadResult.isErr()) {
              throw new Error("Failed to generate data measurement payload");
            }
            const dataPayloadB64 = Buffer.from(
              dataPayloadResult.value,
            ).toString("base64");
            console.log(
              "[toggleMosfet] Sending data measurement payload:",
              dataPayloadB64,
            );
            await connected.writeCharacteristicWithResponseForService(
              _SERVICE_UUID,
              _CHARACTERISTIC_UUID,
              dataPayloadB64,
            );
            console.log(
              "[toggleMosfet] Commands sent, awaiting response for data measurements",
            );
            const response = await responsePromise;
            const parsed = parseResponse(
              response,
              BMSCommandType.DATA_MEASUREMENTS,
            );

            if (parsed.isErr()) {
              throw new Error("Failed to parse data measurements");
            }

            console.log(
              "[toggleMosfet] Parsed measuramentes, mosfetOnFlag:",
              parsed.value.mosfetOn,
            );
            // Return the current MOSFET status.
            return parsed.value.mosfetOn;
          } finally {
            releaseLock();
          }
        })(),
        (err) =>
          err instanceof Error
            ? createAppError({ publicMessage: err.message })
            : createAppError({
                publicMessage: "Unable to toggle mosfet, operation failed",
              }),
      );
    },
    [connectedDevice],
  );

  /**
   * Disconnect from the device.
   */
  const disconnect = useCallback((): AppResultAsync<true> => {
    if (!connectedDevice) {
      return appErrAsync({
        publicMessage: "Unable to disconnect, no connected device",
      });
    }
    return fromPromise(
      (async () => {
        const timeout = 5000; // 5 seconds total
        const interval = 500; // check every 500 ms
        const start = Date.now();
        while (true) {
          try {
            // Attempt to cancel the connection
            await connectedDevice.cancelConnection();
          } catch (err) {
            console.error("Disconnection attempt failed:", err);
          }
          // Wait for the interval period
          await new Promise((res) => setTimeout(res, interval));

          // Check if the device is disconnected
          const stillConnected = await connectedDevice.isConnected();
          if (!stillConnected) {
            console.log("Device disconnected successfully.");
            setConnectedDevice(null);
            return true;
          }
          // If we exceed the timeout, throw an error
          if (Date.now() - start >= timeout) {
            throw new Error("Device disconnection timed out after 5 seconds.");
          }
          console.log("Device still connected, retrying disconnection...");
        }
      })(),
      (err) =>
        err instanceof Error
          ? createAppError({ publicMessage: err.message })
          : createAppError({
              publicMessage: "Unable to disconnect, operation failed",
            }),
    ).map(() => true as const);
  }, [connectedDevice]);

  /**
   * Check if the device is still connected.
   */
  const checkConnectionStatus = useCallback((): AppResultAsync<boolean> => {
    if (!connectedDevice) {
      return okAsync(false);
    }
    return fromPromise(connectedDevice.isConnected(), (err) =>
      err instanceof Error
        ? createAppError({ publicMessage: err.message })
        : createAppError({
            publicMessage: "Unable to check connection status",
          }),
    );
  }, [connectedDevice]);

  return {
    scanAndConnect,
    requestPermissions,
    requestDataMesuraments,
    disconnect,
    connectedDevice,
    toggleMosfet,
    checkConnectionStatus,
  };
};
