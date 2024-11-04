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
  if (month < 1 || month > 12 || day < 1 || day > 31)
    return appErr({
      publicMessage: "Unable to parse date",
      publicDetails: "Invalid date value",
    });

  return ok(
    `20${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
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
  )
    return appErr({
      publicMessage: "Unable to parse time",
      publicDetails: "Invalid time value",
    });

  return ok(
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds * 2).padStart(2, "0")}`,
  );
};

export const _extractDataMeasurements = (
  response: Uint8Array,
): AppResult<DataMeasurements> => {
  return _readWord(response, 11)
    .map((tempCell) => ({ tempCell }))
    .andThen((res) =>
      _readWord(response, 13).map((tempShunt) => ({ ...res, tempShunt })),
    )
    .andThen((res) =>
      _readWord(response, 15).map((current) => ({
        ...res,
        current: current / 100,
      })),
    )
    .andThen((res) =>
      Result.combine(
        Array.from({ length: 20 }, (_, i) => _readWord(response, 17 + i * 2)),
      ).map((voltages) => ({ ...res, voltages })),
    )
    .map((res) => ({
      ...res,
      soc: response[61],
    }))
    .andThen((res) =>
      _readWord(response, 49).map((vbattTotal) => ({
        ...res,
        vbattTotal: vbattTotal / 1000,
      })),
    )
    .andThen((res) =>
      _readWord(response, 25).map((alarmBms) => ({ ...res, alarmBms })),
    )
    .andThen((res) =>
      _parseDate(response[34], response[35], response[36]).map((dateRtc) => ({
        ...res,
        dateRtc,
      })),
    )
    .andThen((res) =>
      _parseTime(response[37], response[38], response[39]).map((hourRtc) => ({
        ...res,
        hourRtc,
      })),
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
