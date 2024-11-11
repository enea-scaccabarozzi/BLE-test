import { UseMutateFunction } from "@tanstack/react-query";
import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@app/shared/components/animated-background";
import { Button } from "@app/shared/components/button";
import { Text } from "@app/shared/components/text";
import { LockOpen } from "@app/shared/icons/lock-open";
import { PlugZap } from "@app/shared/icons/plug-zap";
import { AppError } from "@app/shared/types/errors";

interface IProps {
  openDoorMutate: UseMutateFunction<true, AppError, void, unknown>;
  startChargeMutate: UseMutateFunction<true, AppError, void, unknown>;
  stationId: number;
  slot: number;
  action: "openDoor" | "startCharge";
  isLoading: boolean;
}

export const StartChargeComponent = ({
  openDoorMutate,
  startChargeMutate,
  stationId,
  slot,
  action,
  isLoading,
}: IProps) => {
  const handleAction = () => {
    if (action === "openDoor") {
      openDoorMutate();
    } else {
      startChargeMutate();
    }
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
              {action === "openDoor" ? (
                <LockOpen height="73%" width="73%" className="text-white" />
              ) : (
                <PlugZap height="73%" width="73%" className="text-white" />
              )}
            </View>
          </View>
          <Text className="text-primary text-3xl font-bold text-center">
            {action === "openDoor"
              ? `Open Slot #${slot}`
              : `Start Charging at Slot #${slot}`}
          </Text>
          <Text className="text-muted-foreground text-center">
            {action === "openDoor"
              ? `This action will open the slot number ${slot} at station number ${stationId}.`
              : `Now you can insert the plug into the slot and then trigger the charging process.`}
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
            {isLoading ? (
              <Text>Loading...</Text>
            ) : (
              <Text>
                {action === "openDoor" ? "Open Slot" : "Start Charge"}
              </Text>
            )}
          </Button>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
};
