/* eslint-disable neverthrow/must-use-result */
import { AppErrorType } from "@app/shared/types/errors";

import { generateCommandPayload } from "../commands";
import {
  DATA_MEASUREMENTS_DATA,
  PRODUCTION_DATA_DATA,
  USAGE_SUMMARY_DATA,
} from "../constants";
import { calculateCrc8 } from "../crc8";
import { BMSCommandType } from "../types";

jest.mock("../crc8", () => ({
  calculateCrc8: jest.fn(),
}));

describe("[ bms-protocol ]", () => {
  describe("[ commands ]", () => {
    describe("[ generateCommandPayload ]", () => {
      beforeEach(() => {
        jest.mocked(calculateCrc8).mockClear();
      });

      it("should generate payload for DATA_MEASUREMENTS command type", () => {
        const result = generateCommandPayload(BMSCommandType.DATA_MEASUREMENTS);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual(
            new Uint8Array([...DATA_MEASUREMENTS_DATA]),
          );
        }
      });

      it("should generate payload for USAGE_SUMMARY command type", () => {
        const result = generateCommandPayload(BMSCommandType.USAGE_SUMMARY);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual(new Uint8Array([...USAGE_SUMMARY_DATA]));
        }
      });

      it("should generate payload for PRODUCTION_DATA command type", () => {
        const result = generateCommandPayload(BMSCommandType.PRODUCTION_DATA);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual(
            new Uint8Array([...PRODUCTION_DATA_DATA]),
          );
        }
      });

      it("should return an error for an invalid command type", () => {
        const result = generateCommandPayload(
          "INVALID_COMMAND_TYPE" as BMSCommandType,
        );

        expect(result.isErr()).toBe(true);
        if (result.isErr())
          expect(result.error.type).toBe(AppErrorType.PublicError);

        expect(calculateCrc8).not.toHaveBeenCalled();
      });
    });
  });
});
