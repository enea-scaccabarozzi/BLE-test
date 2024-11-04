/* eslint-disable neverthrow/must-use-result */

import { calculateCrc8 } from "../crc8";
import {
  _extractDataMeasurements,
  _extractProductionData,
  _extractUsageSummary,
  _prepareResponse,
  parseResponse,
} from "../responses";
import { BMSCommandType } from "../types";

jest.mock("../crc8", () => ({
  calculateCrc8: jest.fn(),
}));

describe("[ bms-protocol ]", () => {
  describe("[ responses ]", () => {
    describe("_prepareResponse", () => {
      it("should return error if response is too short", () => {
        const response = new Uint8Array([0x01]);
        const result = _prepareResponse(response);
        expect(result.isErr()).toBe(true);
      });

      it("should return error if CRC does not match", () => {
        jest.mocked(calculateCrc8).mockReturnValue(0x00);
        const response = new Uint8Array([0x01, 0x02, 0x03, 0xff]);
        const result = _prepareResponse(response);
        expect(result.isErr()).toBe(true);
      });

      it("should return data if CRC matches", () => {
        jest.mocked(calculateCrc8).mockReturnValue(0x03);
        const response = new Uint8Array([0x01, 0x02, 0x03]);
        const result = _prepareResponse(response);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual(new Uint8Array([0x01, 0x02]));
        }
      });
    });

    describe("_extractDataMeasurements", () => {
      it("should extract valid data measurements", () => {
        const response = new Uint8Array(62);
        response[34] = 0x15; // year (e.g., 2021)
        response[35] = 0x05; // month
        response[36] = 0x0a; // day
        response[37] = 0x0e; // hours
        response[38] = 0x1e; // minutes
        response[39] = 0x0f; // seconds
        const result = _extractDataMeasurements(response);
        expect(result.isOk()).toBe(true);
      });

      it("should return error for invalid date format in data measurements", () => {
        const response = new Uint8Array(62);
        response[35] = 0x0d; // Invalid month (13)
        const result = _extractDataMeasurements(response);
        expect(result.isErr()).toBe(true);
      });

      it("should return error for invalid time format in data measurements", () => {
        const response = new Uint8Array(62);
        response[37] = 0x19; // Invalid hour (25)
        const result = _extractDataMeasurements(response);
        expect(result.isErr()).toBe(true);
      });
    });

    describe("_extractUsageSummary", () => {
      it("should extract valid usage summary with correct date", () => {
        const response = new Uint8Array(10);
        response[5] = 0x16; // year (e.g., 2022)
        response[6] = 0x06; // month
        response[7] = 0x0f; // day
        const result = _extractUsageSummary(response);
        expect(result.isOk()).toBe(true);
      });

      it("should return error for invalid date format in usage summary", () => {
        const response = new Uint8Array(10);
        response[6] = 0x00; // Invalid month (0)
        const result = _extractUsageSummary(response);
        expect(result.isErr()).toBe(true);
      });
    });

    describe("_extractProductionData", () => {
      it("should extract valid production data with correct date", () => {
        const response = new Uint8Array(32);
        response[0] = 0x13; // year (e.g., 2019)
        response[1] = 0x08; // month
        response[2] = 0x14; // day
        response.set(new Uint8Array(10).fill(0x41), 3); // Serial Number (ASCII 'A')
        response.set(new Uint8Array(18).fill(0x42), 14); // Tag Data (ASCII 'B')
        const result = _extractProductionData(response);
        expect(result.isOk()).toBe(true);
      });

      it("should return error for non-ASCII serial number in production data", () => {
        const response = new Uint8Array(32);
        response[0] = 0x15; // year (e.g., 2021)
        response[1] = 0x09; // month
        response[2] = 0x0f; // day
        response[3] = 0xff; // Non-ASCII character
        const result = _extractProductionData(response);
        expect(result.isErr()).toBe(true);
      });

      it("should return error for invalid date in production data", () => {
        const response = new Uint8Array(32);
        response[1] = 0x0d; // Invalid month (13)
        const result = _extractProductionData(response);
        expect(result.isErr()).toBe(true);
      });
    });

    describe("parseResponse", () => {
      it("should parse response for DATA_MEASUREMENTS command type with valid date and time", () => {
        const response = new Uint8Array(62);
        response[34] = 0x14; // year (e.g., 2020)
        response[35] = 0x04; // month
        response[36] = 0x19; // day
        response[37] = 0x0b; // hours
        response[38] = 0x2d; // minutes
        response[39] = 0x14; // seconds
        jest
          .mocked(calculateCrc8)
          .mockReturnValue(response[response.length - 1]);
        const result = parseResponse(
          response,
          BMSCommandType.DATA_MEASUREMENTS,
        );
        expect(result.isOk()).toBe(true);
      });

      it("should return error for malformed date in DATA_MEASUREMENTS", () => {
        const response = new Uint8Array(62);
        response[34] = 0x15; // year (e.g., 2021)
        response[35] = 0x0e; // Invalid month (14)
        jest
          .mocked(calculateCrc8)
          .mockReturnValue(response[response.length - 1]);
        const result = parseResponse(
          response,
          BMSCommandType.DATA_MEASUREMENTS,
        );
        expect(result.isErr()).toBe(true);
      });

      it("should return error for malformed time in DATA_MEASUREMENTS", () => {
        const response = new Uint8Array(62);
        response[37] = 0x18; // Invalid hour (24)
        jest
          .mocked(calculateCrc8)
          .mockReturnValue(response[response.length - 1]);
        const result = parseResponse(
          response,
          BMSCommandType.DATA_MEASUREMENTS,
        );
        expect(result.isErr()).toBe(true);
      });

      it("should parse response for USAGE_SUMMARY with valid date", () => {
        const response = new Uint8Array(10);
        response[5] = 0x14; // year
        response[6] = 0x06; // month
        response[7] = 0x0f; // day
        jest
          .mocked(calculateCrc8)
          .mockReturnValue(response[response.length - 1]);
        const result = parseResponse(response, BMSCommandType.USAGE_SUMMARY);
        expect(result.isOk()).toBe(true);
      });

      it("should return error for malformed date in USAGE_SUMMARY", () => {
        const response = new Uint8Array(10);
        response[6] = 0x00; // Invalid month (0)
        jest
          .mocked(calculateCrc8)
          .mockReturnValue(response[response.length - 1]);
        const result = parseResponse(response, BMSCommandType.USAGE_SUMMARY);
        expect(result.isErr()).toBe(true);
      });

      it("should parse response for PRODUCTION_DATA with valid date", () => {
        const response = new Uint8Array(33);
        response[0] = 0x13; // year (e.g., 2019)
        response[1] = 0x08; // month
        response[2] = 0x14; // day
        response.set(new Uint8Array(10).fill(0x41), 3); // Serial Number (ASCII 'A')
        response.set(new Uint8Array(18).fill(0x42), 14); // Tag Data (ASCII 'B')

        // Mock calculateCrc8 to simulate CRC at the end
        jest.mocked(calculateCrc8).mockReturnValue(0xff); // Example CRC value
        response[response.length - 1] = 0xff; // Append mocked CRC byte to the response

        const result = parseResponse(response, BMSCommandType.PRODUCTION_DATA);
        expect(result.isOk()).toBe(true);
      });

      it("should return error for malformed date in PRODUCTION_DATA", () => {
        const response = new Uint8Array(32);
        response[1] = 0x0d; // Invalid month (13)
        jest
          .mocked(calculateCrc8)
          .mockReturnValue(response[response.length - 1]);
        const result = parseResponse(response, BMSCommandType.PRODUCTION_DATA);
        expect(result.isErr()).toBe(true);
      });
    });
  });
});
