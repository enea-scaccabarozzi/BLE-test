import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { ChargeStatus } from "@app/home/type/charge";
import { Button } from "@app/shared/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@app/shared/components/card";
import { Label } from "@app/shared/components/label";
import { Separator } from "@app/shared/components/separator";
import { Text } from "@app/shared/components/text";

interface IProps {
  status?: ChargeStatus;
  isDeviceConnected?: boolean;
}

const relativeHumanTime = (target: Date): string => {
  const diff = target.getTime() - new Date().getTime();
  if (diff <= 0) return "Just a few seconds...";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;

  return "Less than a minute...";
};

export const RemoteTabComponent = ({ status, isDeviceConnected }: IProps) => {
  const [isCharged, setIsCharged] = useState(
    status &&
      status.end_timestamp === undefined &&
      status.estimatedEnd &&
      new Date(status.estimatedEnd) < new Date(),
  );

  useEffect(() => {
    if (status) {
      setIsCharged(
        status.end_timestamp === undefined &&
          status.estimatedEnd &&
          new Date(status.estimatedEnd) < new Date(),
      );
    }
  }, [status]);

  const handleStop = () => {
    router.push("/charge/stop");
  };

  const handleStart = () => {
    router.push({
      pathname: "/charge/scan",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Charge Status</CardTitle>
        <CardDescription>
          Monitor from here the status of your charge
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4 native:gap-2">
        {status &&
        (["charged", "charging"].includes(status.status) || isCharged) ? (
          <View className="gap-1">
            <Text>The device is in charge</Text>
            {status.threshDownlow && (
              <View className="text-red-500 gap-2 flex-row align-middle">
                <View className="rounded-full bg-red-500 h-3 aspect-square mt-[5px]" />
                <Text className="text-red-500">
                  Station voltage is below the threshold, it's required to stop
                  the charge and remove the cable
                </Text>
              </View>
            )}
            {status.temperatureAlarm && (
              <View className="text-yellow-500 gap-2 flex-row align-middle">
                <View className="rounded-full bg-yellow-500 h-3 aspect-square mt-[5px]" />
                <Text className="text-yellow-500">
                  Station temperature is critical, charge may be stopped
                </Text>
              </View>
            )}
            <View>
              <Separator className="my-4" />
              <View className="gap-1">
                {status.status === "charged" || isCharged ? (
                  <Label>
                    Battery is fully charged. Please stop the charge and close
                    the door
                  </Label>
                ) : (
                  <Label>
                    Battery is now charging.
                    {status.estimatedEnd ? (
                      <Text>
                        {" "}
                        Estimated time to finish charge:{" "}
                        {relativeHumanTime(new Date(status.estimatedEnd))}
                      </Text>
                    ) : (
                      <Text>..</Text>
                    )}
                  </Label>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-1">
            <Text>The device is not in charge</Text>
          </View>
        )}
      </CardContent>
      <CardFooter>
        {status &&
        (["charging", "charged"].includes(status.status) || isCharged) ? (
          <Button className="w-full" onPress={handleStop}>
            <Text>Stop Charge</Text>
          </Button>
        ) : status &&
          ["closedoor", "disconnected", "charge_timeout", "ready"].includes(
            status.status,
          ) ? (
          <Button className="w-full" disabled={true}>
            <Text>Door is open</Text>
          </Button>
        ) : isDeviceConnected ? (
          <Button className="w-full" onPress={handleStart}>
            <Text>Start Charge</Text>
          </Button>
        ) : (
          <Button className="w-full" disabled={true}>
            <Text>Connect the device first</Text>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
