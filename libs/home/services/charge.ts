import { isAxiosError } from "axios";
import { fromPromise, okAsync } from "neverthrow";

import { useSession } from "@app/auth/hooks/use-session";
import { useBle } from "@app/ble/hooks/use-ble";
import { appErrAsync, createAppError } from "@app/shared/errors";
import { useHttp } from "@app/shared/hooks/use-http";
import { AppResultAsync } from "@app/shared/types/errors";

import { ChargeStatus } from "../type/charge";

export const useChargeService = () => {
  const { http } = useHttp();
  const { toggleMosfet, isConnected, requestDataUpdate } = useBle();
  const { profile } = useSession();

  const promiseAdapter = <T>(resultFn: () => AppResultAsync<T>) => {
    return async () => {
      const res = await resultFn();
      return res.isOk() ? res.value : Promise.reject(res.error);
    };
  };

  const getEstimatedChargeTime = (): AppResultAsync<Date> => {
    if (!isConnected) {
      return appErrAsync({
        publicMessage: "Device not connected, cannot calculate charge time",
      });
    }

    return requestDataUpdate().andThen((data) => {
      if (!profile) {
        return appErrAsync({
          publicMessage: "You need to be logged in to calculate charge time",
        });
      }
      const amp = profile.batteryAmp;
      const capacity = profile.batteryCapacity;
      const startPercentage = data.socPerc;
      if (
        amp <= 0 ||
        capacity <= 0 ||
        startPercentage < 0 ||
        startPercentage > 100
      ) {
        return appErrAsync({
          publicMessage: "Invalid battery parameters",
        });
      }

      const remainingCapacity = capacity * (1 - startPercentage / 100); // in Ah
      const chargeTimeHours = remainingCapacity / amp; // in hours
      const timeMinutes = Math.round(chargeTimeHours * 60); // convert to minutes
      if (timeMinutes <= 0) {
        return okAsync(new Date());
      }

      const estimatedEnd = new Date(Date.now() + timeMinutes * 60 * 1000); // convert to milliseconds

      return okAsync(
        estimatedEnd, // convert to milliseconds
      );
    });
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
    return getEstimatedChargeTime().andThen((estimatedEnd) =>
      fromPromise(
        http.patch<true>("/charge/start", { estimatedEnd }),
        (err) => {
          return isAxiosError(err) && err.response?.status === 400
            ? createAppError({
                publicMessage: `Cannot start charge, ${err.response.data.message.toLowerCase()}`,
              })
            : createAppError({
                publicMessage: "Cannot start charge, internal error",
              });
        },
      )
        .map((res) => res.data)
        .andThrough(() =>
          isConnected
            ? toggleMosfet(false)
            : appErrAsync({
                publicMessage: "Cannot start charge, device not connected",
              }),
        )
        .mapErr((err) => {
          console.error(err);
          return err;
        }),
    );
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
