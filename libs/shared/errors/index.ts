import { err, errAsync } from "neverthrow";

import {
  AppErrorType,
  type RecoverableError,
  type ErrorOpts,
  type InternalError,
  type PublicError,
  type PublicErrorOpts,
  AppError,
  GenericErrorOpts,
  AppResult,
  AppResultAsync,
} from "../types/errors";

const createPublicErr = ({
  message,
  publicMessage,
  publicDetails,
}: PublicErrorOpts): PublicError => {
  return {
    type: AppErrorType.PublicError,
    timestamp: Date.now(),
    message: message ?? publicMessage,
    publicMessage,
    publicDetails,
  };
};

const createInternalErr = ({ message }: ErrorOpts): InternalError => {
  return {
    type: AppErrorType.InternalError,
    timestamp: Date.now(),
    message,
  };
};

const createRecoverableErr = ({ message }: ErrorOpts): RecoverableError => {
  return {
    type: AppErrorType.RecoverableError,
    timestamp: Date.now(),
    message,
  };
};

export const createAppError = (opts: GenericErrorOpts): AppError => {
  if ("publicMessage" in opts) {
    return createPublicErr(opts);
  } else if ("recoverable" in opts && opts.recoverable) {
    return createRecoverableErr(opts);
  } else {
    return createInternalErr(opts);
  }
};

export const appErr = (opts: GenericErrorOpts): AppResult<never> => {
  return err(createAppError(opts));
};

export const appErrAsync = (opts: GenericErrorOpts): AppResultAsync<never> => {
  return errAsync(createAppError(opts));
};
