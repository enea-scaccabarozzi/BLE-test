// Example: Integration with Authentication
// This demonstrates how to start background ping tracking when user signs in

import { useEffect } from "react";

import { useSession } from "@app/auth/hooks/use-session";

import { useBackgroundPing } from "./use-background-ping";

export function useAutoBackgroundTracking() {
  const { session, profile } = useSession();
  const { startTracking, stopTracking, isTracking } = useBackgroundPing();

  useEffect(() => {
    const handleAuthStateChange = async () => {
      if (session && profile && !isTracking) {
        // User is authenticated and tracking is not active
        console.log(
          "Starting background location tracking for authenticated user",
        );

        const success = await startTracking();
        if (success) {
          console.log("Background ping service started successfully");
        } else {
          console.log("Failed to start background ping service");
        }
      } else if (!session && isTracking) {
        // User signed out, stop tracking
        console.log("Stopping background location tracking - user signed out");

        const success = await stopTracking();
        if (success) {
          console.log("Background ping service stopped successfully");
        }
      }
    };

    handleAuthStateChange();
  }, [session, profile, isTracking, startTracking, stopTracking]);

  return {
    isTrackingEnabled: isTracking && !!session,
  };
}
