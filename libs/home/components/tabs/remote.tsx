import { router } from "expo-router";
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
}

export const RemoteTabComponent = ({ status }: IProps) => {
  const isCharging = status
    ? ["charging", "charged"].includes(status.status)
    : false;

  const isCloseDoor = status ? status.status === "closedoor" : false;

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
        <CardTitle>Device</CardTitle>
        <CardDescription>
          Monitor from here the status of your device charge
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4 native:gap-2">
        {isCharging && status ? (
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
                {status.current && status.status === "charged" ? (
                  <Label>
                    Battery is fully charged. Please stop the charge and close
                    the door
                  </Label>
                ) : (
                  <Label>
                    Battery is now charging. Please wait until the charge is
                    finished
                  </Label>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-1">
            <Text>The device is not connected</Text>
          </View>
        )}
      </CardContent>
      <CardFooter>
        {isCharging ? (
          <Button className="w-full" onPress={handleStop}>
            <Text>Stop Charge</Text>
          </Button>
        ) : isCloseDoor ? (
          <Button className="w-full" disabled={true}>
            <Text>Door is open</Text>
          </Button>
        ) : (
          <Button className="w-full" onPress={handleStart}>
            <Text>Start Charge</Text>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
