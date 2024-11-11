import { Stack } from "expo-router";

import { Protected } from "@app/auth/guards/protected";

export default function ProtectedLayout() {
  return (
    <Protected>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="auth/signout"
          options={{
            presentation: "modal",
          }}
        />
        <Stack.Screen name="auth/profile" />
        <Stack.Screen name="charge/scan" />
        <Stack.Screen name="charge/start" />
        <Stack.Screen name="charge/stop" />
      </Stack>
    </Protected>
  );
}
