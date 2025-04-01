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
import { Progress } from "@app/shared/components/progress";
import { Separator } from "@app/shared/components/separator";
import { Text } from "@app/shared/components/text";

interface IProps {
  status?: ChargeStatus;
}

export const RemoteTabComponent = ({ status }: IProps) => {
  const isCharging = status
    ? ["charging", "charged"].includes(status.status)
    : false;

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
            <View>
              <Separator className="my-4" />
              <View className="gap-1">
                {status.current && status.current >= 99 ? (
                  <Label>
                    Battery is fully charged. Please stop the charge and close
                    the door
                  </Label>
                ) : (
                  <Label>Battery {status.current}%</Label>
                )}

                <Progress
                  value={status.current || 0}
                  className="w-full"
                  indicatorClassName={`${status.current || 0 <= 30 ? "bg-red-500" : "bg-green-500"}`}
                />
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
        ) : (
          <Button className="w-full" onPress={handleStart}>
            <Text>Start Charge</Text>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
