import React from "react";
import { View } from "react-native";

import { BackgroundLocationControls } from "@app/shared";

/**
 * Example settings screen component that includes background location controls
 * for manual testing and debugging.
 */
export function SettingsScreen() {
  return (
    <View className="flex-1 bg-background p-4">
      <BackgroundLocationControls className="mb-6" />

      {/* Add your other settings components here */}
    </View>
  );
}

// To add this to your navigation, you might create a file like:
// app/(private)/settings.tsx
/*
import { SettingsScreen } from "@app/shared/examples/settings-screen";

export default function Settings() {
  return <SettingsScreen />;
}
*/
