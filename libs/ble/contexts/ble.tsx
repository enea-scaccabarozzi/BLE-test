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
});

export const BleProvider = ({ children, devMode }: IProps) => {
  const {
    scanAndConnect,
    requestPermissions,
    requestDataMesuraments,
    disconnect,
  } = useBleService();

  const [isConnected, setIsConnected] = useState(false);
  const [dataMeasurements, setDataMeasurements] =
    useState<DataMeasurements | null>(null);

  const mockData = (): DataMeasurements => ({
    tempCell: 25,
    tempShunt: 25,
    current: 25,
    voltages: [25, 25, 25, 25, 25, 25, 25, 25],
    soc: 25,
    vbattTotal: 25,
    alarmBms: 25,
    dateRtc: "25",
    hourRtc: "25",
  });

  const connect = useCallback(() => {
    if (devMode) {
      setIsConnected(true);
      setDataMeasurements(mockData());
      return okAsync(true as const);
    }

    return requestPermissions()
      .andThen(scanAndConnect)
      .andThen(requestDataMesuraments)
      .andTee(() => setIsConnected(true))
      .map(() => true as const)
      .mapErr((err) => {
        setIsConnected(false);
        return err;
      });
  }, [devMode, requestDataMesuraments, requestPermissions, scanAndConnect]);

  const handleDisconnect = useCallback(() => {
    if (devMode) {
      setIsConnected(false);
      return okAsync(true as const);
    }

    return disconnect().andTee(() => setIsConnected(false));
  }, [devMode, disconnect]);

  const requestDataUpdate = useCallback(() => {
    if (!isConnected)
      return appErrAsync({
        publicMessage: "Unable to request data, not connected",
      });

    if (devMode) {
      setDataMeasurements(mockData());
      return okAsync(mockData());
    }

    return requestDataMesuraments().andTee(setDataMeasurements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(requestDataUpdate, 10_000); // Update every 10 seconds
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
      }}
    >
      {children}
    </BleContext.Provider>
  );
};
