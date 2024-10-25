import { ok } from "neverthrow";

import { appErr } from "@app/shared/errors";
import { AppResult } from "@app/shared/types/errors";

import {
  DATA_MEASUREMENTS_DATA,
  PRODUCTION_DATA_DATA,
  USAGE_SUMMARY_DATA,
} from "./constants";
import { calculateCrc8 } from "./crc8";
import { BMSCommandType } from "./types";

export const generateCommandPayload = (
  commandType: BMSCommandType,
): AppResult<Uint8Array> => {
  let commandData: number[];

  switch (commandType) {
    case BMSCommandType.DATA_MEASUREMENTS:
      commandData = DATA_MEASUREMENTS_DATA;
      break;

    case BMSCommandType.USAGE_SUMMARY:
      commandData = USAGE_SUMMARY_DATA;
      break;

    case BMSCommandType.PRODUCTION_DATA:
      commandData = PRODUCTION_DATA_DATA;
      break;

    default:
      return appErr({
        publicMessage: "Unable to generate command payload",
        publicDetails: "Invalid command type",
      });
  }

  const command = new Uint8Array(commandData);
  const checksum = calculateCrc8(command);
  return ok(new Uint8Array([...command, checksum]));
};
