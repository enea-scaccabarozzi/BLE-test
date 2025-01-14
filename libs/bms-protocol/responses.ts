import { ok, Result } from "neverthrow";

import { appErr } from "@app/shared/errors";
import { AppResult } from "@app/shared/types/errors";

// import { calculateCrc8 } from "./crc8";
import {
  BMSCommandType,
  DataMeasurements,
  ProductionData,
  UsageSummary,
} from "./types";

// Pure function to parse and validate response
export const _prepareResponse = (
  response: Uint8Array,
): AppResult<Uint8Array<ArrayBuffer>> => {
  if (response.length < 2)
    return appErr({
      publicMessage: "Unable to parse response",
      publicDetails: "Response is too short to contain valid data",
    });

  const data = response.slice(0, -1); // All but the last byte (CRC)
  // const crcReceived = response[response.length - 1]; // Last byte is CRC
  // const crcCalculated = calculateCrc8(data);

  // if (crcReceived !== crcCalculated)
  //   return appErr({
  //     publicMessage: "Unable to parse response",
  //     publicDetails: "CRC mismatch",
  //   }); // Invalid CRC

  return ok(data); // Valid response, return data without CRC byte
};

// Helper to read a 16-bit word (big-endian)
const _readWord = (response: Uint8Array, index: number): AppResult<number> => {
  if (index + 1 >= response.length)
    return appErr({
      publicMessage: "Unable to read word from response",
      publicDetails: "Out of bounds access while reading word",
    });

  return ok((response[index] << 8) | response[index + 1]);
};

// Helper to parse date from 16-bit year, month, and day values
const _parseDate = (
  year: number,
  month: number,
  day: number,
): AppResult<string> => {
  const fullYear = 1980 + year; // Adjust the year based on the base year 1980

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return appErr({
      publicMessage: "Unable to parse date",
      publicDetails: "Invalid date value",
    });
  }

  return ok(
    `${fullYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  );
};

// Helper to parse time from hour, minute, and second values
const _parseTime = (
  hours: number,
  minutes: number,
  seconds: number,
): AppResult<string> => {
  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 29
  ) {
    return appErr({
      publicMessage: "Unable to parse time",
      publicDetails: "Invalid time value",
    });
  }

  return ok(
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds * 2).padStart(2, "0")}`,
  );
};

export const _extractDataMeasurements = (
  response: Uint8Array,
): AppResult<DataMeasurements> => {
  return _readWord(response, 11) // Read tempCell
    .map((tempCell) => ({ tempCell }))
    .andThen((res) =>
      _readWord(response, 13).map((tempShunt) => ({ ...res, tempShunt })),
    )
    .andThen((res) =>
      Result.combine([_readWord(response, 15), _readWord(response, 16)]) // Combine MSB and LSB for current
        .map(([currentMsb, currentLsb]) => {
          const current = (currentMsb << 16) | currentLsb; // Combine into int32
          return { ...res, current: current / 100 }; // Scale current
        }),
    )
    .andThen((res) =>
      Result.combine(
        Array.from({ length: 20 }, (_, i) => _readWord(response, 17 + i * 2)), // Read each cell voltage
      ).map((voltages) => {
        const avgCellVoltage =
          voltages.reduce((acc, voltage) => acc + voltage, 0) / voltages.length; // Calculate average cell voltage
        return { ...res, voltages, avgCellVoltage };
      }),
    )
    .map((res) => ({
      ...res,
      soc: response[61], // State of Charge
    }))
    .andThen((res) =>
      Result.combine([_readWord(response, 49), _readWord(response, 50)]) // Total battery voltage (MSB and LSB)
        .map(([vbattMsb, vbattLsb]) => {
          const vbattTotal = (vbattMsb << 16) | vbattLsb; // Combine into int32
          return { ...res, vbattTotal: vbattTotal / 1000 }; // Scale to volts
        }),
    )
    .andThen((res) =>
      _readWord(response, 25).map((alarmWord) => {
        const alarmBms = {
          maxCurrent: Boolean(alarmWord & (1 << 0)),
          highBatteryTemp: Boolean(alarmWord & (1 << 1)),
          highBoardTemp: Boolean(alarmWord & (1 << 2)),
          maxChargeVoltage: Boolean(alarmWord & (1 << 3)),
          minDischargeVoltage: Boolean(alarmWord & (1 << 4)),
          lowEnergyLevel: Boolean(alarmWord & (1 << 5)),
          lowChargeTemp: Boolean(alarmWord & (1 << 6)),
          minChargeVoltage: Boolean(alarmWord & (1 << 7)),
          maxCurrentWarning: Boolean(alarmWord & (1 << 8)),
          highBatteryTempWarning: Boolean(alarmWord & (1 << 9)),
          highBoardTempWarning: Boolean(alarmWord & (1 << 10)),
          maxChargeVoltageWarning: Boolean(alarmWord & (1 << 11)),
          minDischargeVoltageWarning: Boolean(alarmWord & (1 << 12)),
          lowEnergyLevelWarning: Boolean(alarmWord & (1 << 13)),
          lowChargeTempWarning: Boolean(alarmWord & (1 << 14)),
          minChargeVoltageWarning: Boolean(alarmWord & (1 << 15)),
        };
        return { ...res, alarmBms };
      }),
    )
    .andThen(
      (res) =>
        _readWord(response, 29).map((cntMaxCurrent) => ({
          ...res,
          cntMaxCurrent,
        })), // Max current alarm counter
    )
    .andThen(
      (res) =>
        _readWord(response, 30).map((chargeCycles) => ({
          ...res,
          chargeCycles,
        })), // Charge cycle count
    )
    .andThen((res) =>
      Result.combine([_readWord(response, 32), _readWord(response, 33)]) // Balancing status flags (MSB and LSB)
        .map(([balancingMsb, balancingLsb]) => ({
          ...res,
          balancingStatus: { msb: balancingMsb, lsb: balancingLsb },
        })),
    )
    .andThen((res) =>
      _readWord(response, 40).map((statusWord) => {
        const flgBms = {
          chargerCommand: Boolean(statusWord & (1 << 0)),
          toolCommand: Boolean(statusWord & (1 << 1)),
          eepromInProgramming: Boolean(statusWord & (1 << 2)),
          eepromAlarm: Boolean(statusWord & (1 << 3)),
          chargeState: Boolean(statusWord & (1 << 4)),
          balancingType: Boolean(statusWord & (1 << 5)),
          dischargeState: Boolean(statusWord & (1 << 6)),
          generalAlarm: Boolean(statusWord & (1 << 7)),
          buzzerCommand: Boolean(statusWord & (1 << 8)),
          outputAvailable: Boolean(statusWord & (1 << 9)),
          chargeCompleted: Boolean(statusWord & (1 << 10)),
          prechargeChannelCharge: Boolean(statusWord & (1 << 11)),
          prechargeChannelDischarge: Boolean(statusWord & (1 << 12)),
          chargeRelayCommand: Boolean(statusWord & (1 << 13)),
          mosfetOn: Boolean(statusWord & (1 << 14)),
        };
        return { ...res, flgBms };
      }),
    )
    .andThen((res) =>
      _readWord(response, 55).map((statusWord1) => {
        const flg1Bms = {
          customClientFlag1: Boolean(statusWord1 & (1 << 0)),
          customClientFlag2: Boolean(statusWord1 & (1 << 1)),
          customClientFlag3: Boolean(statusWord1 & (1 << 2)),
          transportMode: Boolean(statusWord1 & (1 << 3)),
          eepromLoadError: Boolean(statusWord1 & (1 << 4)),
          maxDischargeRepeatCurrent: Boolean(statusWord1 & (1 << 5)),
          maxContinuousDischargeCurrent: Boolean(statusWord1 & (1 << 6)),
          maxChargeRepeatCurrent: Boolean(statusWord1 & (1 << 7)),
          currentInInt32: Boolean(statusWord1 & (1 << 8)),
          isMasterVersion: Boolean(statusWord1 & (1 << 9)),
          outputNegativeDischarge: Boolean(statusWord1 & (1 << 10)),
          outputNegativeCharge: Boolean(statusWord1 & (1 << 11)),
          unused1: Boolean(statusWord1 & (1 << 12)),
          unused2: Boolean(statusWord1 & (1 << 13)),
          unused3: Boolean(statusWord1 & (1 << 14)),
          unused4: Boolean(statusWord1 & (1 << 15)),
        };
        return { ...res, flg1Bms };
      }),
    );
};

export const _extractUsageSummary = (
  response: Uint8Array,
): AppResult<UsageSummary> => {
  return _parseDate(response[5], response[6], response[7]).map(
    (dateCharge) => ({
      cyclesDischarge: response[0],
      cyclesCharge: response[1],
      cntMxCurr: response[2],
      dateCharge,
      all90dcli: response[8],
    }),
  );
};

export const _extractProductionData = (
  response: Uint8Array,
): AppResult<ProductionData> => {
  if (response.length < 32)
    return appErr({
      publicMessage: "Unable to extract production data",
      publicDetails: "Response is too short for ProductionData",
    });

  const asciiRegex = /^[\x20-\x7E]*$/;

  return _parseDate(response[0], response[1], response[2])
    .map((installationDate) => ({
      installationDate,
      serialNumber: String.fromCharCode(...response.slice(3, 13)),
      tagData: String.fromCharCode(...response.slice(14, 32)),
    }))
    .andThrough(({ serialNumber }) =>
      asciiRegex.test(serialNumber)
        ? ok(null)
        : appErr({
            publicMessage: "Unable to extract production data",
            publicDetails: "Serial number contains non-ASCII characters",
          }),
    )
    .andThrough(({ tagData }) =>
      asciiRegex.test(tagData)
        ? ok(null)
        : appErr({
            publicMessage: "Unable to extract production data",
            publicDetails: "Tag data contains non-ASCII characters",
          }),
    );
};

// Function to extract and parse data based on the protocol structure
export function parseResponse(
  response: Uint8Array,
  commandType: BMSCommandType.DATA_MEASUREMENTS,
): AppResult<DataMeasurements>;
export function parseResponse(
  response: Uint8Array,
  commandType: BMSCommandType.USAGE_SUMMARY,
): AppResult<UsageSummary>;
export function parseResponse(
  response: Uint8Array,
  commandType: BMSCommandType.PRODUCTION_DATA,
): AppResult<ProductionData>;
export function parseResponse(
  response: Uint8Array,
  commandType: BMSCommandType,
): AppResult<DataMeasurements | ProductionData | UsageSummary> {
  return _prepareResponse(response).andThen((response) => {
    switch (commandType) {
      case BMSCommandType.DATA_MEASUREMENTS:
        return _extractDataMeasurements(response);

      case BMSCommandType.USAGE_SUMMARY:
        return _extractUsageSummary(response);

      case BMSCommandType.PRODUCTION_DATA:
        return _extractProductionData(response);

      default:
        return appErr({
          publicMessage: "Unable to extract data from response",
          publicDetails: "Unknown command type",
        });
    }
  });
}
