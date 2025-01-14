import { okAsync } from "neverthrow";
import React, { createContext, useState, useEffect, useCallback } from "react";

import { DataMeasurements } from "@app/bms-protocol";
import { appErrAsync } from "@app/shared/errors";

import { useBleService } from "../services/ble";
import { BleContextType } from "../types/context";

interface IProps {
  children: React.ReactNode;
  devMode?: boolean;
}

export const BleContext = createContext<BleContextType>({
  isConnected: false,
  dataMeasurements: null,
  connect: () => appErrAsync({ message: "Not implemented" }),
  disconnect: () => appErrAsync({ message: "Not implemented" }),
  requestDataUpdate: () => appErrAsync({ message: "Not implemented" }),
  toggleMosfet: () => appErrAsync({ message: "Not implemented" }),
});

export const BleProvider = ({ children, devMode }: IProps) => {
  const {
    scanAndConnect,
    requestPermissions,
    requestDataMesuraments,
    disconnect,
    toggleMosfet,
  } = useBleService();

  const [isConnected, setIsConnected] = useState(false);
  const [dataMeasurements, setDataMeasurements] =
    useState<DataMeasurements | null>(null);

  const mockData = (): DataMeasurements => ({
    tempCell: 22,
    tempShunt: 25,
    current: -0.01,
    voltages: [
      65533, 2570, 2566, 2566, 2564, 2565, 2564, 2564, 2560, 2563, 2564, 2563,
      2563, 2563, 2563, 2562, 0, 0, 0, 0,
    ],
    avgCellVoltage: 5199.65,
    soc: 8,
    vbattTotal: 0,
    alarmBms: {
      maxCurrent: false,
      highBatteryTemp: false,
      highBoardTemp: true,
      maxChargeVoltage: false,
      minDischargeVoltage: false,
      lowEnergyLevel: false,
      lowChargeTemp: false,
      minChargeVoltage: false,
      maxCurrentWarning: false,
      highBatteryTempWarning: true,
      highBoardTempWarning: false,
      maxChargeVoltageWarning: true,
      minDischargeVoltageWarning: false,
      lowEnergyLevelWarning: false,
      lowChargeTempWarning: false,
      minChargeVoltageWarning: false,
    },
    cntMaxCurrent: 2564,
    chargeCycles: 1034,
    balancingStatus: { msb: 1034, lsb: 2560 },
    flgBms: {
      chargerCommand: false,
      toolCommand: true,
      eepromInProgramming: false,
      eepromAlarm: true,
      chargeState: false,
      balancingType: false,
      dischargeState: false,
      generalAlarm: false,
      buzzerCommand: true,
      outputAvailable: true,
      chargeCompleted: false,
      prechargeChannelCharge: false,
      prechargeChannelDischarge: false,
      chargeRelayCommand: false,
      mosfetOn: false,
    },
    flg1Bms: {
      customClientFlag1: false,
      customClientFlag2: false,
      customClientFlag3: false,
      transportMode: false,
      eepromLoadError: false,
      maxDischargeRepeatCurrent: false,
      maxContinuousDischargeCurrent: false,
      maxChargeRepeatCurrent: false,
      currentInInt32: false,
      isMasterVersion: false,
      outputNegativeDischarge: false,
      outputNegativeCharge: false,
      unused1: false,
      unused2: false,
      unused3: false,
      unused4: false,
    },
  });

  const requestDataUpdate = useCallback(() => {
    if (!isConnected)
      return appErrAsync({
        publicMessage: "Unable to request data, not connected",
      });

    if (devMode) {
      setDataMeasurements(mockData());
      return okAsync(mockData());
    }

    return requestDataMesuraments(undefined)
      .andTee(setDataMeasurements)
      .andTee((data) => console.log("setted:", data))
      .mapErr((err) => {
        console.log("ctx err:", err);
        return err;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const connect = useCallback(() => {
    if (devMode) {
      setIsConnected(true);
      setDataMeasurements(mockData());
      return okAsync(true as const);
    }

    return requestPermissions()
      .andThen(scanAndConnect)
      .andTee(() => setIsConnected(true))
      .map(() => true as const)
      .mapErr((err) => {
        setIsConnected(false);
        console.log("ctx err:", err);
        return err;
      });
  }, [devMode, requestPermissions, scanAndConnect]);

  const handleDisconnect = useCallback(() => {
    if (devMode) {
      setIsConnected(false);
      return okAsync(true as const);
    }

    return disconnect().andTee(() => setIsConnected(false));
  }, [devMode, disconnect]);

  const handleToggleMosfet = useCallback(
    (targetStatus: boolean) => {
      if (devMode) {
        return okAsync(targetStatus);
      }

      return requestPermissions()
        .andThen(() => toggleMosfet(targetStatus, undefined))
        .andTee((res) => console.log("Mosfet Status:", res))
        .andThen((res) =>
          res === targetStatus
            ? okAsync(res)
            : appErrAsync({
                publicMessage:
                  "Failed to toggle mosfet, target status not reached",
              }),
        )
        .mapErr((err) => {
          console.log("ctx err:", err);
          return err;
        });
    },
    [devMode, requestPermissions, toggleMosfet],
  );

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(requestDataUpdate, 3_000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, requestDataUpdate]);

  return (
    <BleContext.Provider
      value={{
        isConnected,
        dataMeasurements,
        connect,
        disconnect: handleDisconnect,
        requestDataUpdate,
        toggleMosfet: handleToggleMosfet,
      }}
    >
      {children}
    </BleContext.Provider>
  );
};
