import React from "react";

import { useAutoBackgroundTracking } from "../hooks/use-auto-background-tracking";

/**
 * Component that automatically manages background location tracking
 * based on user authentication state.
 *
 * This component should be rendered once in your app, preferably
 * in the root layout or main app component.
 */
export function BackgroundTrackingManager() {
  const { isTrackingEnabled } = useAutoBackgroundTracking();

  // This component doesn't render anything visible
  // It just manages the background tracking state
  React.useEffect(() => {
    console.log("Background tracking status:", isTrackingEnabled);
  }, [isTrackingEnabled]);

  return null;
}
