export enum BMSCommandType {
  DATA_MEASUREMENTS = "DATA_MEASUREMENTS",
  USAGE_SUMMARY = "USAGE_SUMMARY",
  PRODUCTION_DATA = "PRODUCTION_DATA",
}

export type DataMeasurements = {
  tempCell: number;
  tempShunt: number;
  current: number;
  voltages: number[];
  soc: number;
  vbattTotal: number;
  alarmBms: number;
  dateRtc: string;
  hourRtc: string;
};

export type UsageSummary = {
  cyclesDischarge: number;
  cyclesCharge: number;
  cntMxCurr: number;
  dateCharge: string;
  all90dcli: number;
};

export type ProductionData = {
  installationDate: string;
  serialNumber: string;
  tagData: string;
};
