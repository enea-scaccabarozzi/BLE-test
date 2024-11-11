import { UseMutateFunction } from "@tanstack/react-query";
import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@app/shared/components/animated-background";
import { Button } from "@app/shared/components/button";
import { Text } from "@app/shared/components/text";
import { CircleSlash } from "@app/shared/icons/circl-slash";
import { AppError } from "@app/shared/types/errors";

interface IProps {
  stopChargeMutate: UseMutateFunction<true, AppError, void, unknown>;
  isLoading: boolean;
}

export const StopChargeComponent = ({
  stopChargeMutate,
  isLoading,
}: IProps) => {
  const handleAction = () => {
    stopChargeMutate();
  };

  const handleCancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <AnimatedBackground>
      <SafeAreaView className="w-4/5 min-h-screen flex gap-3 justify-center mx-auto">
        <View className="gap-1 px-8 mt-[-30]">
          <View className="w-full flex items-center justify-center">
            <View className="aspect-square bg-primary w-16 rounded-xl border-solid border-4 border-primary shadow-2xl flex items-center justify-center">
              <CircleSlash height="73%" width="73%" className="text-white" />
            </View>
          </View>
          <Text className="text-primary text-3xl font-bold text-center">
            Stop Charging
          </Text>
          <Text className="text-muted-foreground text-center">
            Once the charge is stopped, you can unplug the vehicle from the
            station
          </Text>
        </View>
        <View className="gap-2">
          <Button
            variant="secondary"
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text>Cancel</Text>
          </Button>
          <Button onPress={handleAction} disabled={isLoading}>
            {isLoading ? <Text>Loading...</Text> : <Text>Stop Charging</Text>}
          </Button>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
};
