import * as Location from "expo-location";
import { fromPromise, okAsync } from "neverthrow";

import { useSession } from "@app/auth/hooks/use-session";
import { DataMeasurements } from "@app/bms-protocol";

import { appErrAsync, createAppError } from "../errors";
import { useHttp } from "../hooks/use-http";
import { IAnalyticEvent } from "../types/analytics";
import { AppResultAsync } from "../types/errors";

interface LocationCoords {
  latitude: number | null;
  longitude: number | null;
}

const getCurrentLocation = (): AppResultAsync<LocationCoords> => {
  return fromPromise(
    (async () => {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return { latitude: null, longitude: null };
      }

      // Get current position with timeout and accuracy settings
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // 5 seconds timeout
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    })(),
    (err) =>
      appErrAsync({
        publicMessage: "Failed to get current location",
        publicDetails: "Unable to retrieve location data",
      }),
  ).orElse(() =>
    okAsync({ latitude: null, longitude: null } as LocationCoords),
  );
};

export const useAnalyticsService = () => {
  const { http } = useHttp();
  const { profile } = useSession();

  const trackEvent = (data: IAnalyticEvent): AppResultAsync<true> => {
    return getCurrentLocation()
      .andThen((coords) =>
        fromPromise(
          http.post<true>("/analytics/events", {
            eventData: JSON.stringify(data.eventData),
            eventType: data.eventType,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
          () => {
            return createAppError({
              publicMessage: "Internal Server Error",
              publicDetails: "Unable to track analytics event",
            });
          },
        ),
      )
      .map(() => true);
  };

  const trackOnboardData = (data: DataMeasurements): AppResultAsync<true> => {
    if (!profile) {
      return appErrAsync({
        publicMessage: "User profile not found",
        publicDetails: "Unable to track onboard data without user profile",
      });
    }

    return getCurrentLocation()
      .andThen((coords) =>
        fromPromise(
          http.post<true>("/analytics/onboard", {
            deviceName: profile.deviceName,
            bmsData: data,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
          () => {
            return createAppError({
              publicMessage: "Internal Server Error",
              publicDetails: "Unable to track onboard data",
            });
          },
        ),
      )
      .map(() => true);
  };

  return {
    trackEvent,
    trackOnboardData,
  };
};
