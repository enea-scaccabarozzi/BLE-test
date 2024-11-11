import { type Result, type ResultAsync } from "neverthrow";

export enum AppErrorType {
  RecoverableError = "RecoverableError",
  InternalError = "InternalError",
  PublicError = "PublicError",
}

export type BaseError = {
  type: AppErrorType;
  message: string;
  timestamp: number;
};

export type RecoverableError = BaseError & {
  type: AppErrorType.RecoverableError;
};

export type InternalError = BaseError & {
  type: AppErrorType.InternalError;
};

export type PublicError = BaseError & {
  type: AppErrorType.PublicError;
  publicMessage: string;
  publicDetails?: string;
};

export type AppError = RecoverableError | InternalError | PublicError;
export type AppResult<T> = Result<T, AppError>;
export type AppResultAsync<T> = ResultAsync<T, AppError>;

export type ErrorOpts = {
  message: string;
};

export type PublicErrorOpts = {
  publicMessage: string;
  publicDetails?: string;
  message?: string;
};

export type GenericErrorOpts =
  | (ErrorOpts & { recoverable?: boolean })
  | PublicErrorOpts;
