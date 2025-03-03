import { ok, Result } from "neverthrow";

import { appErr } from "@app/shared/errors";
import { AppResult } from "@app/shared/types/errors";

import { calculateCrc8 } from "./crc8";
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
  const crcReceived = response[response.length - 1]; // Last byte is CRC
  const crcCalculated = calculateCrc8(data);

  if (crcReceived !== crcCalculated)
    return appErr({
      publicMessage: "Unable to parse response",
      publicDetails: "CRC mismatch",
    }); // Invalid CRC

  return ok(data); // Valid response, return data without CRC byte
};

const _get_world_pos = (world: number): number => {
  const OFFSET = 11;
  return world * 2 + OFFSET;
};

// Parse a signed 16-bit integer from the response.
const parseSigned = (
  response: Uint8Array,
  world: number,
): AppResult<number> => {
  const pos = _get_world_pos(world);
  if (pos + 1 >= response.length)
    return appErr({
      publicMessage: "Unable to read signed from response",
      publicDetails: "Out of bounds access while reading word",
    });

  const value = (response[pos] << 8) | response[pos + 1]; // Big-endian: MSB first
  // Convert to signed integer (16-bit)
  return ok(value >= 0x8000 ? value - 0x10000 : value); // if value >= 0x8000, it's negative
};

// Parse an unsigned 16-bit integer from the response.
const parseUnsigned = (
  response: Uint8Array,
  world: number,
): AppResult<number> => {
  const pos = _get_world_pos(world);
  if (pos + 1 >= response.length)
    return appErr({
      publicMessage: "Unable to read unsigned from response",
      publicDetails: "Out of bounds access while reading word",
    });
  const value = (response[pos] << 8) | response[pos + 1]; // Big-endian: MSB first
  return ok(value); // directly return the unsigned value
};

// Parse two 16-bit words (big-endian) into a 32-bit integer.
const parse32Bit = (response: Uint8Array, world: number): AppResult<number> => {
  const pos = _get_world_pos(world);
  if (pos + 3 >= response.length)
    return appErr({
      publicMessage: "Unable to read 32-bit word from response",
      publicDetails: "Out of bounds access while reading 32-bit word",
    });

  const msb = (response[pos] << 8) | response[pos + 1]; // Most Significant Byte
  const lsb = (response[pos + 2] << 8) | response[pos + 3]; // Least Significant Byte
  // Combine MSB and LSB into a 32-bit integer
  return ok((msb << 16) | lsb); // Big-endian: MSB is shifted to the higher 16 bits
};

// Parse a world value as a date (year, month, day).
const parseDate = (response: Uint8Array, world: number): AppResult<Date> => {
  const pos = _get_world_pos(world);
  if (pos + 1 >= response.length)
    return appErr({
      publicMessage: "Unable to read date from response",
      publicDetails: "Out of bounds access while reading word",
    });

  const value = (response[pos] << 8) | response[pos + 1]; // Big-endian: MSB first
  const year = 1980 + (value >> 9); // First 7 bits for the year (1980 + X)
  const month = (value >> 5) & 0x0f; // Next 4 bits for the month (1-12)
  const day = value & 0x1f; // Last 5 bits for the day (1-31)

  // Create a Date object (months in JavaScript are 0-indexed)
  return ok(new Date(year, month - 1, day)); // Adjust month to 0-based index
};

// Parse a world value as hour, minutes, and minutes*2.
const parseHour = (
  response: Uint8Array,
  world: number,
): AppResult<{ hour: number; minutes: number; seconds: number }> => {
  const pos = _get_world_pos(world);
  if (pos + 1 >= response.length)
    return appErr({
      publicMessage: "Unable to read hour from response",
      publicDetails: "Out of bounds access while reading word",
    });

  const value = (response[pos] << 8) | response[pos + 1]; // Big-endian: MSB first

  const hour = (value >> 11) & 0x1f; // First 5 bits for the hour (0-23)
  const minutes = (value >> 5) & 0x3f; // Next 6 bits for the minutes (0-59)
  const seconds = value & 0x1f; // Last 5 bits for the minutes*2 (0-29)

  return ok({ hour, minutes, seconds });
};

const parseFlags = (
  response: Uint8Array,
  world: number,
): AppResult<boolean[]> => {
  const pos = _get_world_pos(world);
  if (pos + 1 >= response.length)
    return appErr({
      publicMessage: "Unable to read flags from response",
      publicDetails: "Out of bounds access while reading word",
    });

  // convert two bites (big-endian) into an array of 16 booleans
  const value = (response[pos] << 8) | response[pos + 1];
  return ok(
    Array.from({ length: 16 }, (_, i) => !!(value & (1 << i)).valueOf()),
  );
};

export const _extractDataMeasurements = (
  response: Uint8Array,
): AppResult<DataMeasurements> => {
  return parseSigned(response, 0)
    .map((tempCell) => ({ tempCell }))
    .andThen((res) =>
      parseSigned(response, 1).map((tempShunt) => ({
        ...res,
        tempShunt,
      })),
    )
    .andThen((res) =>
      parse32Bit(response, 2).map((current) => ({
        ...res,
        current: current / 100,
      })),
    )
    .andThen((res) =>
      Result.combine(
        Array.from({ length: 20 }, (_, i) => parseUnsigned(response, 4 + i)),
      ).map((voltages) => {
        return { ...res, voltages: voltages.map((v) => v / 1000) };
      }),
    )
    .andThen((res) =>
      parseUnsigned(response, 24).map((avgVoltage) => ({
        ...res,
        avgCellVoltage: avgVoltage / 1000,
      })),
    )
    .andThen((res) =>
      parseFlags(response, 25).map((flags) => ({
        ...res,
        alarmBms: {
          maxCurrent: flags[0],
          highBatteryTemp: flags[1],
          highBoardTemp: flags[2],
          maxChargeVoltage: flags[3],
          minDischargeVoltage: flags[4],
          lowEnergyLevel: flags[5],
          lowChargeTemp: flags[6],
          minChargeVoltage: flags[7],
          maxCurrentWarning: flags[8],
          highBatteryTempWarning: flags[9],
          highBoardTempWarning: flags[10],
          maxChargeVoltageWarning: flags[11],
          minDischargeVoltageWarning: flags[12],
          lowEnergyLevelWarning: flags[13],
          lowChargeTempWarning: flags[14],
          minChargeVoltageWarning: flags[15],
        },
      })),
    )
    .andThen((res) =>
      parse32Bit(response, 26).map((soc) => ({
        ...res,
        soc: soc / 10,
      })),
    )
    .andThen((res) =>
      parseUnsigned(response, 28).map((socPerc) => ({
        ...res,
        socPerc,
      })),
    )
    .andThen((res) =>
      parseUnsigned(response, 29).map((cntMaxCurrent) => ({
        ...res,
        cntMaxCurrent,
      })),
    )
    .andThen((res) =>
      parseUnsigned(response, 30).map((chargeCycles) => ({
        ...res,
        chargeCycles,
      })),
    )
    .andThen((res) =>
      parseUnsigned(response, 31).map((ahNom) => ({
        ...res,
        ahNom: ahNom / 10,
      })),
    )
    .andThen((res) =>
      parseFlags(response, 32).map((comEq) => ({
        ...res,
        comEq,
      })),
    )
    .andThen((res) =>
      parseFlags(response, 33).map((comEq) => ({
        ...res,
        comEq: [...comEq, ...res.comEq],
      })),
    )
    .andThen((res) =>
      parseDate(response, 34).map((dateRtc) => ({
        ...res,
        dateRtc,
      })),
    )
    .andThen((res) =>
      parseHour(response, 35).map((hourRtc) => ({
        ...res,
        hourRtc,
      })),
    )
    .andThen((res) =>
      parseFlags(response, 36).map((flgAdj1) => ({
        ...res,
        flgAdj1,
      })),
    )
    .andThen((res) =>
      parseFlags(response, 37).map((flgAdj2) => ({
        ...res,
        flgAdj2,
      })),
    )
    .andThen((res) =>
      parseHour(response, 38).map((hourSoc) => ({
        ...res,
        hourSoc,
      })),
    )
    .andThen((res) =>
      parseHour(response, 39).map((hourCharg) => ({
        ...res,
        hourCharg,
      })),
    )
    .andThen((res) =>
      parseFlags(response, 40).map((flagBms1) => ({
        ...res,
        flagBms1,
        mosfetOn: flagBms1[15],
      })),
    )
    .andThen((res) =>
      parseFlags(response, 41).map((alarmBms1) => ({
        ...res,
        alarmBms: {
          ...res.alarmBms,
          maxDischargeTension: alarmBms1[0],
          lowTempDischarge: alarmBms1[1],
          maxChargeCurrent: alarmBms1[5],
          maxDischargeContinuosCurrent: alarmBms1[6],
          serial485: alarmBms1[7],
          timerOff: alarmBms1[11],
          e2promError: alarmBms1[12],
          maxDischargeTensionWarning: alarmBms1[8],
          lowTempDischargeWarning: alarmBms1[9],
          maxChargeCurrentWarning: alarmBms1[13],
          maxDischargeContinuosCurrentWarning: alarmBms1[14],
          dischargeContactor: alarmBms1[2],
          chargeContactor: alarmBms1[10],
        },
      })),
    );
};

export const _extractUsageSummary = (
  response: Uint8Array,
): AppResult<UsageSummary> => {
  return appErr({
    publicMessage: "Unable to extract usage summary",
    publicDetails: "Not implemented",
  });
};

export const _extractProductionData = (
  response: Uint8Array,
): AppResult<ProductionData> => {
  return appErr({
    publicMessage: "Unable to extract production data",
    publicDetails: "Not implemented",
  });
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
