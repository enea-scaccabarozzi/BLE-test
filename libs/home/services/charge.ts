import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { fromPromise, fromSafePromise } from "neverthrow";

import { useBle } from "@app/ble/hooks/use-ble";
import { createAppError } from "@app/shared/errors";
import { useHttp } from "@app/shared/hooks/use-http";
import { AppResultAsync } from "@app/shared/types/errors";

import { ChargeStatus } from "../type/charge";

export const useChargeService = () => {
  const { http } = useHttp();
  const { toggleMosfet, isConnected, connect, requestDataUpdate } = useBle();

  const setStartPercentage = async (percentage: number | null) => {
    if (percentage === null) {
      await SecureStore.deleteItemAsync("startPercentage");
    } else {
      await SecureStore.setItemAsync("startPercentage", percentage.toString());
    }
  };

  const getStartPercentage = async (): Promise<number | null> => {
    const percentage = await SecureStore.getItemAsync("startPercentage");
    if (percentage === null) {
      return null;
    }
    return parseInt(percentage, 10);
  };

  const promiseAdapter = <T>(resultFn: () => AppResultAsync<T>) => {
    return async () => {
      const res = await resultFn();
      return res.isOk() ? res.value : Promise.reject(res.error);
    };
  };

  const getEstimatedChargeTime = async (
    current: number,
    capacity: number,
  ): Promise<[number, string]> => {
    const startPercentage = await getStartPercentage();
    if (startPercentage === null) {
      return [0, "0m"];
    }
    // Calculate the remaining capacity to charge
    const remainingCapacityAh = capacity * (1 - startPercentage / 100);

    // Time in hours
    const timeHours = remainingCapacityAh / current;

    // Convert to minutes
    const timeMinutes = timeHours * 60;

    return [timeMinutes, getHumanRelativeTime(timeMinutes)];
  };

  const getHumanRelativeTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
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
      .andThrough(() => (isConnected ? toggleMosfet(false) : connect()))
      .andThrough(() =>
        requestDataUpdate().andThen((data) =>
          fromSafePromise(setStartPercentage(data.socPerc)),
        ),
      )
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
      .andThrough(() => fromSafePromise(setStartPercentage(null)))
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
    getEstimatedChargeTime,
  };
};
