import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { fromPromise } from "neverthrow";

import { createAppError } from "../errors";
import { AppResultAsync } from "../types/errors";

const BACKGROUND_LOCATION_TASK = "background-location";

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    console.log("Received new locations", locations);

    // Process the location data
    if (locations && locations.length > 0) {
      // Store the latest location for processing
      const latestLocation = locations[locations.length - 1];

      // Store location data securely for later processing
      const locationData = JSON.stringify({
        latitude: latestLocation.coords.latitude,
        longitude: latestLocation.coords.longitude,
        timestamp: latestLocation.timestamp,
      });

      // SecureStore operations in background tasks need to be handled carefully
      // We'll use a try-catch to prevent crashes
      try {
        SecureStore.setItemAsync("lastBackgroundLocation", locationData);
      } catch (error) {
        console.error("Failed to store background location:", error);
      }
    }
  }
});

export interface LocationTrackingConfig {
  interval: number; // in milliseconds
  accuracy: Location.Accuracy;
  distanceInterval?: number;
}

export class LocationTrackingService {
  private static isTracking = false;
  private static trackingInterval: NodeJS.Timeout | null = null;
  private static onLocationUpdate?: (location: {
    latitude: number;
    longitude: number;
  }) => void;

  static startBackgroundLocationTracking(
    config: LocationTrackingConfig = {
      interval: 60000, // 1 minute
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 100, // 100 meters
    },
  ): AppResultAsync<true> {
    return fromPromise(
      (async () => {
        // Request permissions
        const { status: foregroundStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== "granted") {
          throw new Error("Foreground location permission denied");
        }

        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== "granted") {
          throw new Error("Background location permission denied");
        }

        // Check if task is already registered
        const isRegistered = await TaskManager.isTaskRegisteredAsync(
          BACKGROUND_LOCATION_TASK,
        );
        if (isRegistered) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }

        // Start background location updates
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: config.accuracy,
          timeInterval: config.interval,
          distanceInterval: config.distanceInterval,
          foregroundService: {
            notificationTitle: "Life2M is tracking your location",
            notificationBody:
              "Location tracking is active to provide vehicle services",
            notificationColor: "#ffffff",
          },
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
        });

        this.isTracking = true;
        console.log("Background location tracking started");

        return true as const;
      })(),
      (error) =>
        createAppError({
          publicMessage: "Failed to start location tracking",
          publicDetails: "Unable to initialize background location tracking",
        }),
    );
  }

  static stopBackgroundLocationTracking(): AppResultAsync<true> {
    return fromPromise(
      (async () => {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(
          BACKGROUND_LOCATION_TASK,
        );
        if (isRegistered) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }

        if (this.trackingInterval) {
          clearInterval(this.trackingInterval);
          this.trackingInterval = null;
        }

        this.isTracking = false;
        console.log("Background location tracking stopped");

        return true as const;
      })(),
      (error) =>
        createAppError({
          publicMessage: "Failed to stop location tracking",
          publicDetails: "Unable to stop background location tracking",
        }),
    );
  }

  static async getTrackingStatus(): Promise<{
    isTracking: boolean;
    isTaskRegistered: boolean;
  }> {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_LOCATION_TASK,
    );
    return {
      isTracking: this.isTracking,
      isTaskRegistered,
    };
  }

  static setLocationUpdateCallback(
    callback: (location: { latitude: number; longitude: number }) => void,
  ) {
    this.onLocationUpdate = callback;
  }

  static getCurrentLocation(): AppResultAsync<{
    latitude: number;
    longitude: number;
  }> {
    return fromPromise(
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission not granted");
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
        });

        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      })(),
      (err) =>
        createAppError({
          publicMessage: "Failed to get current location",
          publicDetails: "Unable to retrieve location data",
        }),
    );
  }

  // Method to process background location updates and send ping events
  static startPingService(
    pingInterval: number = 30000, // 30 seconds
    trackEventCallback: (
      event: { eventType: "ping"; eventData: {} },
      location: { latitude: number; longitude: number },
    ) => void,
  ) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    this.trackingInterval = setInterval(async () => {
      try {
        // Get the last known background location from secure storage
        const lastLocationStr = await SecureStore.getItemAsync(
          "lastBackgroundLocation",
        );

        if (lastLocationStr) {
          const lastLocation = JSON.parse(lastLocationStr);
          trackEventCallback(
            { eventType: "ping", eventData: {} },
            {
              latitude: lastLocation.latitude,
              longitude: lastLocation.longitude,
            },
          );
        } else {
          // Fallback to current location if no background location available
          const currentLocationResult = this.getCurrentLocation();
          currentLocationResult.match(
            (location) => {
              trackEventCallback(
                { eventType: "ping", eventData: {} },
                location,
              );
            },
            (error) => {
              console.error("Failed to get current location for ping:", error);
            },
          );
        }
      } catch (error) {
        console.error("Error in ping service:", error);
      }
    }, pingInterval);
  }

  static stopPingService() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }
}
