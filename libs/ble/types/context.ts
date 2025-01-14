import { DataMeasurements } from "@app/bms-protocol";
import { AppResultAsync } from "@app/shared/types/errors";

export interface BleContextType {
  isConnected: boolean;
  dataMeasurements: DataMeasurements | null;
  connect: () => AppResultAsync<true>;
  disconnect: () => AppResultAsync<true>;
  requestDataUpdate: () => AppResultAsync<DataMeasurements>;
  toggleMosfet: (targetStatus: boolean) => AppResultAsync<boolean>;
}
