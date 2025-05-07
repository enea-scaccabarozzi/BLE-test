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
  canConnect: boolean;
}

export const BleTabComponent = ({
  isConnected,
  deviceData,
  onConnect,
  onDisconnect,
  canConnect,
}: IProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const extractAlarms = (): { warnings: string[]; alarms: string[] } => {
    const alarmsMappings = {
      maxCurrent: { text: "Corrente max", warning: false },
      highBatteryTemp: { text: "Alta temperatura batt.", warning: false },
      highBoardTemp: { text: "Alta temp scheda", warning: false },
      maxChargeVoltage: { text: "Tensione max carica", warning: false },
      minDischargeVoltage: { text: "Tensione minima scarica", warning: false },
      lowEnergyLevel: { text: "Livello energia minimo", warning: false },
      lowChargeTemp: { text: "Bassa temperatura batt. carica", warning: false },
      minChargeVoltage: { text: "Tensione minima carica", warning: false },

      maxDischargeTension: { text: "Tensione massima scarica", warning: false },
      lowTempDischarge: {
        text: "Bassa temperatura batt. scarica",
        warning: false,
      },
      maxChargeCurrent: { text: "Corrente max carica", warning: false },
      maxDischargeContinuosCurrent: {
        text: "Corrente max scarica continuativa",
        warning: false,
      },
      serial485: { text: "Allarme seriale 485", warning: false },
      timerOff: { text: "Allarme timer off", warning: false },
      e2promError: { text: "Allarme caricamento e2prom", warning: false },
      chargeContactor: {
        text: "Allarme contattore di carica positivo",
        warning: false,
      },
      dischargeContactor: {
        text: "Allarme contattore di scarica positivo",
        warning: false,
      },

      maxCurrentWarning: {
        text: "Corrente max",
        warning: true,
      },
      highBatteryTempWarning: {
        text: "Alta temperatura batt.",
        warning: true,
      },
      highBoardTempWarning: {
        text: "Alta temp scheda",
        warning: true,
      },
      maxChargeVoltageWarning: {
        text: "Tensione max carica",
        warning: true,
      },
      minDischargeVoltageWarning: {
        text: "Tensione minima scarica",
        warning: true,
      },
      lowEnergyLevelWarning: {
        text: "Livello energia minimo",
        warning: true,
      },
      lowChargeTempWarning: {
        text: "Bassa temperatura batt. carica",
        warning: true,
      },
      minChargeVoltageWarning: {
        text: "Tensione minima carica",
        warning: true,
      },

      // ------------------------
      maxDischargeTensionWarning: {
        text: "Tensione massima scarica",
        warning: true,
      },
      lowTempDischargeWarning: {
        text: "Bassa temperatura batt. scarica",
        warning: true,
      },
      maxChargeCurrentWarning: { text: "Corrente max carica", warning: true },
      maxDischargeContinuosCurrentWarning: {
        text: "Corrente max scarica continuativa",
        warning: true,
      },
    };

    const warnings: string[] = [];
    const alarms: string[] = [];

    if (deviceData)
      for (const [key, value] of Object.entries(deviceData?.alarmBms)) {
        if (value) {
          if (alarmsMappings[key as keyof typeof alarmsMappings].warning) {
            warnings.push(
              alarmsMappings[key as keyof typeof alarmsMappings].text,
            );
          } else {
            alarms.push(
              alarmsMappings[key as keyof typeof alarmsMappings].text,
            );
          }
        }
      }

    const filteredWarnings = warnings.filter(
      (warning) => !alarms.includes(warning),
    );

    return { warnings: filteredWarnings, alarms };
  };

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
                  <Label>Battery {deviceData.socPerc}%</Label>
                  <Progress
                    value={deviceData.socPerc}
                    className="w-full"
                    indicatorClassName={`${deviceData.socPerc <= 30 ? "bg-red-500" : "bg-green-500"}`}
                  />
                </View>
                {(extractAlarms().alarms.length > 0 ||
                  extractAlarms().warnings.length > 0) && (
                  <View className="gap-1 mt-4">
                    {extractAlarms().alarms.map((alarm, index) => (
                      <View
                        key={index}
                        className="text-red-500 gap-2 flex-row align-middle"
                      >
                        <View className="rounded-full bg-red-500 h-3 aspect-square mt-[5px]" />
                        <Text className="text-red-500">{alarm}</Text>
                      </View>
                    ))}
                    {extractAlarms().warnings.map((warning, index) => (
                      <View
                        key={index + extractAlarms().alarms.length}
                        className="text-yellow-500 gap-2 flex-row align-middle"
                      >
                        <View className="rounded-full bg-yellow-500 h-3 aspect-square mt-[5px]" />
                        <Text className="text-yellow-500">{warning}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
            disabled={isConnecting || !canConnect}
            onPress={handleConnect}
          >
            {isConnecting ? <Text>Connecting...</Text> : <Text>Connect</Text>}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
