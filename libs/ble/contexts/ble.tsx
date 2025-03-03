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
    socPerc: 8,
    ahNom: 0,
    comEq: [false],
    dateRtc: new Date(),
    hourRtc: { hour: 0, minutes: 0, seconds: 0 },
    hourSoc: { hour: 0, minutes: 0, seconds: 0 },
    hourCharg: { hour: 0, minutes: 0, seconds: 0 },

    alarmBms: {
      maxCurrent: false,
      highBatteryTemp: false,
      highBoardTemp: false,
      maxChargeVoltage: false,
      minDischargeVoltage: false,
      lowEnergyLevel: false,
      lowChargeTemp: false,
      minChargeVoltage: false,
      maxDischargeTension: false,
      lowTempDischarge: false,
      maxChargeCurrent: false,
      maxDischargeContinuosCurrent: false,
      serial485: false,
      timerOff: false,
      e2promError: false,
      maxCurrentWarning: false,
      highBatteryTempWarning: false,
      highBoardTempWarning: false,
      maxChargeVoltageWarning: false,
      minDischargeVoltageWarning: false,
      lowEnergyLevelWarning: false,
      lowChargeTempWarning: false,
      minChargeVoltageWarning: false,
      maxDischargeTensionWarning: false,
      lowTempDischargeWarning: false,
      maxChargeCurrentWarning: false,
      maxDischargeContinuosCurrentWarning: false,
      dischargeContactor: false,
      chargeContactor: false,
    },
    flgAdj1: [false],
    flgAdj2: [false],
    mosfetOn: true,
    cntMaxCurrent: 2564,
    chargeCycles: 1034,
    flagBms1: [true],
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
      .andThen((device) => toggleMosfet(true, device))
      .andTee(() => setIsConnected(true))
      .map(() => true as const)
      .mapErr((err) => {
        setIsConnected(false);
        console.log("ctx err:", err);
        return err;
      });
  }, [devMode, requestPermissions, scanAndConnect, toggleMosfet]);

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
      const interval = setInterval(requestDataUpdate, 3_000); // Update every 3 seconds
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
