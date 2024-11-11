import { router } from "expo-router";
import { View } from "react-native";

import { HapticPressable } from "@app/shared/components/haptic-pressable";
import { User } from "@app/shared/icons/user";

export const ProfileButtonComponent = () => {
  return (
    <HapticPressable onPress={() => router.push("/auth/profile")}>
      <View className="aspect-square rounded-full h-14 bg-white shadow-lg flex justify-center align-middle">
        <User className="text-primary ml-[12]" height={25} />
      </View>
    </HapticPressable>
  );
};
