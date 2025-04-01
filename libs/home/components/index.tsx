import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DataMeasurements } from "@app/bms-protocol";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@app/shared/components/tabs";
import { Text } from "@app/shared/components/text";
import { AppResultAsync } from "@app/shared/types/errors";

import { ProfileButtonComponent } from "./profile-btn";
import { StatusIndicatorComponent } from "./status-icon";
import { ChargeStatus } from "../type/charge";
import { BleTabComponent } from "./tabs/ble";
import { RawTabComponent } from "./tabs/raw";
import { RemoteTabComponent } from "./tabs/remote";

interface IProps {
  deviceChargeStatus?: ChargeStatus;
  deviceData: DataMeasurements | null;
  isDeviceConnected: boolean;
  logRawEnabled: boolean;
  onConnect: () => AppResultAsync<true>;
  onDisconnect: () => AppResultAsync<true>;
}

export const HomeComponent = ({
  deviceChargeStatus,
  deviceData,
  logRawEnabled,
  isDeviceConnected,
  onConnect,
  onDisconnect,
}: IProps) => {
  const [selectedTab, setSelectedTab] = useState("ble");

  return (
    <SafeAreaView className="h-full w-full relative">
      <ScrollView>
        <View className="py-3 flex flex-col gap-2 w-full mt-4">
          <Text className="text-primary text-center text-3xl font-bold">
            Welcome Back!
          </Text>
          <Text className="text-muted-foreground text-center">
            From here you can monitor your device status and request a charge
          </Text>
        </View>
        <StatusIndicatorComponent
          isCharging={
            deviceChargeStatus
              ? deviceChargeStatus.status === "charging"
              : false
          }
          isConnected={isDeviceConnected}
        />
        <View className="flex-1 justify-center p-6">
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full max-w-[400px] mx-auto flex-col gap-1.5"
          >
            <TabsList className="flex-row w-full">
              <TabsTrigger value="ble" className="flex-1">
                <Text>Device</Text>
              </TabsTrigger>
              <TabsTrigger value="remote" className="flex-1">
                <Text>Charge</Text>
              </TabsTrigger>
              {logRawEnabled && (
                <TabsTrigger value="raw" className="flex-1">
                  <Text>Raw</Text>
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="ble">
              <BleTabComponent
                isConnected={isDeviceConnected}
                deviceData={deviceData}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
              />
            </TabsContent>
            <TabsContent value="remote">
              <RemoteTabComponent status={deviceChargeStatus} />
            </TabsContent>
            {logRawEnabled && (
              <TabsContent value="raw">
                <RawTabComponent data={deviceData} />
              </TabsContent>
            )}
          </Tabs>
        </View>
      </ScrollView>

      <View className="absolute top-0 right-0 my-14 mx-8">
        <ProfileButtonComponent />
      </View>
    </SafeAreaView>
  );
};
