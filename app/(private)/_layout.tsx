import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    // <Protected>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="connecting"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="auth/signout"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="auth/profile"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen name="charge/index" />
      <Stack.Screen
        name="charge/scan"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
    // </Protected>
  );
}
