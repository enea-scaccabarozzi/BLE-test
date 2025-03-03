export enum BMSCommandType {
  DATA_MEASUREMENTS = "DATA_MEASUREMENTS",
  USAGE_SUMMARY = "USAGE_SUMMARY",
  PRODUCTION_DATA = "PRODUCTION_DATA",
  MOSFET_ON = "MOSFET_ON",
  MOSFET_OFF = "MOSFET_OFF",
}

export type DataMeasurements = {
  tempCell: number;
  tempShunt: number;
  current: number;
  voltages: number[];
  avgCellVoltage: number;
  soc: number;
  socPerc: number;
  cntMaxCurrent: number;
  chargeCycles: number;
  ahNom: number;
  comEq: boolean[];
  dateRtc: Date;
  hourRtc: {
    hour: number;
    minutes: number;
    seconds: number;
  };
  hourSoc: {
    hour: number;
    minutes: number;
    seconds: number;
  };
  hourCharg: {
    hour: number;
    minutes: number;
    seconds: number;
  };

  // Alarm status as booleans
  alarmBms: {
    maxCurrent: boolean;
    highBatteryTemp: boolean;
    highBoardTemp: boolean;
    maxChargeVoltage: boolean;
    minDischargeVoltage: boolean;
    lowEnergyLevel: boolean;
    lowChargeTemp: boolean;
    minChargeVoltage: boolean;
    maxDischargeTension: boolean;
    lowTempDischarge: boolean;
    maxChargeCurrent: boolean;
    maxDischargeContinuosCurrent: boolean;
    serial485: boolean;
    timerOff: boolean;
    e2promError: boolean;
    chargeContactor: boolean;
    dischargeContactor: boolean;
    maxCurrentWarning: boolean;
    highBatteryTempWarning: boolean;
    highBoardTempWarning: boolean;
    maxChargeVoltageWarning: boolean;
    minDischargeVoltageWarning: boolean;
    lowEnergyLevelWarning: boolean;
    lowChargeTempWarning: boolean;
    minChargeVoltageWarning: boolean;
    maxDischargeTensionWarning: boolean;
    lowTempDischargeWarning: boolean;
    maxChargeCurrentWarning: boolean;
    maxDischargeContinuosCurrentWarning: boolean;
  };
  flgAdj1: boolean[];
  flgAdj2: boolean[];
  flagBms1: boolean[];
  mosfetOn: boolean;
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
