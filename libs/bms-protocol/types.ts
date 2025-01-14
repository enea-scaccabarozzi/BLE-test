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
  vbattTotal: number;
  cntMaxCurrent: number;
  chargeCycles: number;
  balancingStatus: { msb: number; lsb: number };

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
    maxCurrentWarning: boolean;
    highBatteryTempWarning: boolean;
    highBoardTempWarning: boolean;
    maxChargeVoltageWarning: boolean;
    minDischargeVoltageWarning: boolean;
    lowEnergyLevelWarning: boolean;
    lowChargeTempWarning: boolean;
    minChargeVoltageWarning: boolean;
  };

  // System status flags as booleans
  flgBms: {
    chargerCommand: boolean;
    toolCommand: boolean;
    eepromInProgramming: boolean;
    eepromAlarm: boolean;
    chargeState: boolean;
    balancingType: boolean;
    dischargeState: boolean;
    generalAlarm: boolean;
    buzzerCommand: boolean;
    outputAvailable: boolean;
    chargeCompleted: boolean;
    prechargeChannelCharge: boolean;
    prechargeChannelDischarge: boolean;
    chargeRelayCommand: boolean;
    mosfetOn: boolean;
  };

  flg1Bms: {
    customClientFlag1: boolean;
    customClientFlag2: boolean;
    customClientFlag3: boolean;
    transportMode: boolean;
    eepromLoadError: boolean;
    maxDischargeRepeatCurrent: boolean;
    maxContinuousDischargeCurrent: boolean;
    maxChargeRepeatCurrent: boolean;
    currentInInt32: boolean;
    isMasterVersion: boolean;
    outputNegativeDischarge: boolean;
    outputNegativeCharge: boolean;
    unused1: boolean;
    unused2: boolean;
    unused3: boolean;
    unused4: boolean;
  };
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
