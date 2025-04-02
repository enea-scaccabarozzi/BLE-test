import { isAxiosError } from "axios";
import { fromPromise } from "neverthrow";

import { useBle } from "@app/ble/hooks/use-ble";
import { createAppError } from "@app/shared/errors";
import { useHttp } from "@app/shared/hooks/use-http";
import { AppResultAsync } from "@app/shared/types/errors";

import { ChargeStatus } from "../type/charge";

export const useChargeService = () => {
  const { http } = useHttp();
  const { toggleMosfet } = useBle();

  const promiseAdapter = <T>(resultFn: () => AppResultAsync<T>) => {
    return async () => {
      const res = await resultFn();
      return res.isOk() ? res.value : Promise.reject(res.error);
    };
  };

  const fetchStatus = (): AppResultAsync<ChargeStatus> => {
    return fromPromise(http.get<ChargeStatus>("/charge/status"), (err) => {
      return isAxiosError(err) && err.response?.status === 400
        ? createAppError({
            publicMessage: "Cannot fetch charge status, slot not found",
          })
        : createAppError({
            publicMessage: "Cannot fetch charge status, internal error",
          });
    })
      .map((res) => res.data)
      .mapErr((err) => {
        console.error(err);
        return err;
      });
  };

  const openDoor = (
    stationId: number,
    slotId: number,
  ): AppResultAsync<true> => {
    return fromPromise(
      http.patch<true>(`/charge/open/${stationId}/${slotId}`),
      (err) => {
        return isAxiosError(err) &&
          err.response?.data.message === "Unable to reach the station"
          ? createAppError({
              publicMessage: "Cannot open door, station unreachable",
            })
          : createAppError({
              publicMessage: "Cannot open door, internal error",
            });
      },
    )
      .map((res) => res.data)
      .mapErr((err) => {
        console.error(err);
        return err;
      });
  };

  const startCharge = (): AppResultAsync<true> => {
    return fromPromise(http.patch<true>("/charge/start"), (err) => {
      return isAxiosError(err) && err.response?.status === 400
        ? createAppError({
            publicMessage: `Cannot start charge, ${err.response.data.message.toLowerCase()}`,
          })
        : createAppError({
            publicMessage: "Cannot start charge, internal error",
          });
    })
      .map((res) => res.data)
      .andThrough(() => toggleMosfet(false))
      .mapErr((err) => {
        console.error(err);
        return err;
      });
  };

  const stopCharge = (): AppResultAsync<true> => {
    return fromPromise(http.patch<true>("/charge/stop"), (err) => {
      return isAxiosError(err) && err.response?.status === 400
        ? createAppError({
            publicMessage: `Cannot stop charge, ${err.response.data.message.toLowerCase()}`,
          })
        : createAppError({
            publicMessage: "Cannot stop charge, internal error",
          });
    })
      .map((res) => res.data)
      .mapErr((err) => {
        console.error(err);
        return err;
      });
  };

  const createDoorViolation = (): AppResultAsync<true> => {
    return fromPromise(http.post<true>("/charge/violation"), (err) => {
      return createAppError({
        publicMessage: "Cannot create door violation, internal error",
      });
    })
      .map((res) => res.data)
      .mapErr((err) => {
        console.error(err);
        return err;
      });
  };

  return {
    promiseAdapter,
    fetchStatus,
    openDoor,
    startCharge,
    stopCharge,
    createDoorViolation,
  };
};
