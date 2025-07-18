import * as Location from "expo-location";

import { useAnalyticsService } from "./analytics";
import { LocationTrackingService } from "./background-location";
import { IPingEvent } from "../types/analytics";

/**
 * Service for managing background location tracking and ping events
 */
export class BackgroundPingService {
  private static analyticsService: ReturnType<
    typeof useAnalyticsService
  > | null = null;
  private static isRunning = false;

  static initialize(analyticsService: ReturnType<typeof useAnalyticsService>) {
    this.analyticsService = analyticsService;
  }

  static async startLocationTracking(): Promise<boolean> {
    if (this.isRunning) {
      console.log("Background ping service is already running");
      return true;
    }

    if (!this.analyticsService) {
      console.error("Analytics service not initialized");
      return false;
    }

    try {
      // Start background location tracking
      const trackingResult =
        LocationTrackingService.startBackgroundLocationTracking({
          interval: 60000, // 1 minute for location updates
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100, // Update every 100 meters
        });

      const success = await trackingResult.match(
        () => true,
        (error) => {
          console.error("Failed to start location tracking:", error);
          return false;
        },
      );

      if (!success) {
        return false;
      }

      // Start ping service (sends ping every 5 minutes)
      LocationTrackingService.startPingService(
        30000, // 30 seconds
        (event, location) => {
          this.sendPingEvent(event as IPingEvent, location);
        },
      );

      this.isRunning = true;
      console.log("Background ping service started successfully");
      return true;
    } catch (error) {
      console.error("Error starting background ping service:", error);
      return false;
    }
  }

  static async stopLocationTracking(): Promise<boolean> {
    if (!this.isRunning) {
      console.log("Background ping service is not running");
      return true;
    }

    try {
      // Stop ping service
      LocationTrackingService.stopPingService();

      // Stop background location tracking
      const stopResult =
        LocationTrackingService.stopBackgroundLocationTracking();

      const success = await stopResult.match(
        () => true,
        (error) => {
          console.error("Failed to stop location tracking:", error);
          return false;
        },
      );

      if (!success) {
        return false;
      }

      this.isRunning = false;
      console.log("Background ping service stopped successfully");
      return true;
    } catch (error) {
      console.error("Error stopping background ping service:", error);
      return false;
    }
  }

  static async getStatus(): Promise<{
    isRunning: boolean;
    locationTracking: {
      isTracking: boolean;
      isTaskRegistered: boolean;
    };
  }> {
    const trackingStatus = await LocationTrackingService.getTrackingStatus();

    return {
      isRunning: this.isRunning,
      locationTracking: trackingStatus,
    };
  }

  private static sendPingEvent(
    event: IPingEvent,
    location: { latitude: number; longitude: number },
  ) {
    if (!this.analyticsService) {
      console.error("Analytics service not available for ping event");
      return;
    }

    console.log("Sending ping event with location:", location);

    // Send the ping event with the current location
    this.analyticsService.trackEventWithLocation(event, location).match(
      () => {
        console.log("Ping event sent successfully");
      },
      (error) => {
        console.error("Failed to send ping event:", error);
      },
    );
  }

  // Method to send a ping event immediately (for testing or manual triggers)
  static async sendImmediatePing(): Promise<boolean> {
    if (!this.analyticsService) {
      console.error("Analytics service not initialized");
      return false;
    }

    try {
      const locationResult = LocationTrackingService.getCurrentLocation();

      return new Promise((resolve) => {
        locationResult.match(
          (location) => {
            this.sendPingEvent({ eventType: "ping", eventData: {} }, location);
            resolve(true);
          },
          (error) => {
            console.error("Failed to get location for immediate ping:", error);
            resolve(false);
          },
        );
      });
    } catch (error) {
      console.error("Error sending immediate ping:", error);
      return false;
    }
  }
}
