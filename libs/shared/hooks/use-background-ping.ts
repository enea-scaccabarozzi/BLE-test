import { useEffect, useState } from "react";

import { useAnalyticsService } from "../services/analytics";
import { BackgroundPingService } from "../services/background-ping";

interface UseBackgroundPingReturn {
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<boolean>;
  sendImmediatePing: () => Promise<boolean>;
  getStatus: () => Promise<{
    isRunning: boolean;
    locationTracking: {
      isTracking: boolean;
      isTaskRegistered: boolean;
    };
  }>;
}

export const useBackgroundPing = (): UseBackgroundPingReturn => {
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyticsService = useAnalyticsService();

  // Initialize the background ping service with analytics
  useEffect(() => {
    BackgroundPingService.initialize(analyticsService);
  }, [analyticsService]);

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await BackgroundPingService.getStatus();
        setIsTracking(status.isRunning);
      } catch (err) {
        console.error("Error checking background ping status:", err);
        setError("Failed to check tracking status");
      }
    };

    checkStatus();
  }, []);

  const startTracking = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await BackgroundPingService.startLocationTracking();
      if (success) {
        setIsTracking(true);
        console.log("Background location tracking started successfully");
      } else {
        setError("Failed to start background location tracking");
      }
      return success;
    } catch (err) {
      console.error("Error starting background tracking:", err);
      setError("Error starting background tracking");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await BackgroundPingService.stopLocationTracking();
      if (success) {
        setIsTracking(false);
        console.log("Background location tracking stopped successfully");
      } else {
        setError("Failed to stop background location tracking");
      }
      return success;
    } catch (err) {
      console.error("Error stopping background tracking:", err);
      setError("Error stopping background tracking");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendImmediatePing = async (): Promise<boolean> => {
    setError(null);

    try {
      const success = await BackgroundPingService.sendImmediatePing();
      if (!success) {
        setError("Failed to send immediate ping");
      }
      return success;
    } catch (err) {
      console.error("Error sending immediate ping:", err);
      setError("Error sending immediate ping");
      return false;
    }
  };

  const getStatus = async () => {
    try {
      return await BackgroundPingService.getStatus();
    } catch (err) {
      console.error("Error getting status:", err);
      throw new Error("Failed to get status");
    }
  };

  return {
    isTracking,
    isLoading,
    error,
    startTracking,
    stopTracking,
    sendImmediatePing,
    getStatus,
  };
};
