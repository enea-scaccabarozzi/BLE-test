import { useState } from "react";
import { View } from "react-native";

import { DataMeasurements } from "@app/bms-protocol";
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
import { useToast } from "@app/shared/hooks/use-toast";
import { AppErrorType, AppResultAsync } from "@app/shared/types/errors";

interface IProps {
  isConnected: boolean;
  deviceData: DataMeasurements | null;
  onConnect: () => AppResultAsync<true>;
  onDisconnect: () => AppResultAsync<true>;
}

export const BleTabComponent = ({
  isConnected,
  deviceData,
  onConnect,
  onDisconnect,
}: IProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    setIsConnecting(true);
    return onConnect()
      .map(() => toast("Connected to device", "success"))
      .map(() => setIsConnecting(false))
      .mapErr((err) =>
        toast(
          err.type === AppErrorType.PublicError
            ? err.publicDetails || err.publicMessage
            : "Unable to connect to device",
          "destructive",
        ),
      )
      .mapErr(() => setIsConnecting(false));
  };

  const handleDisconnect = () => {
    setIsConnecting(true);
    return onDisconnect()
      .map(() => toast("Disconnected from device", "success"))
      .map(() => setIsConnecting(false))
      .mapErr((err) =>
        toast(
          err.type === AppErrorType.PublicError
            ? err.publicDetails || err.publicMessage
            : "Unable to disconnect from device",
          "destructive",
        ),
      )
      .mapErr(() => setIsConnecting(false));
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
        {isConnected ? (
          <View className="gap-1">
            <Text>The device is connected</Text>
            {deviceData && (
              <View>
                <Separator className="my-4" />
                <View className="gap-1">
                  <Label>Battery</Label>
                  <Progress
                    value={deviceData?.current}
                    className="w-full"
                    indicatorClassName={`${deviceData?.current <= 30 ? "bg-red-500" : "bg-green-500"}`}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="gap-1">
            <Text>The device is not connected</Text>
          </View>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button
            className="w-full"
            disabled={isConnecting}
            onPress={handleDisconnect}
          >
            {isConnecting ? (
              <Text>Disconnecting...</Text>
            ) : (
              <Text>Disconnect</Text>
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isConnecting}
            onPress={handleConnect}
          >
            {isConnecting ? <Text>Connecting...</Text> : <Text>Connect</Text>}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
