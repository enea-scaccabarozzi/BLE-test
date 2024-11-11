import { CameraView, Camera, ScanningResult } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@app/shared/components/animated-background";
import { Button } from "@app/shared/components/button";
import { Separator } from "@app/shared/components/separator";
import { Text } from "@app/shared/components/text";
import { CameraOff } from "@app/shared/icons/camera-off";

export const ScanComponent = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleScanned = (data: ScanningResult) => {
    setScanned(true);

    const urlData = data.data;
    const expectedScheme = "life2m://";

    if (!urlData.startsWith(expectedScheme)) {
      setScanned(false);
      return;
    }

    const urlWithoutScheme = urlData.slice(expectedScheme.length);
    const [path, queryString] = urlWithoutScheme.split("?");

    if (path !== "charge/start") {
      setScanned(false);
      return;
    }

    // Parse query parameters manually
    const params = new URLSearchParams(queryString);
    const stationId = params.get("stationId");
    const slot = params.get("slot");

    if (
      !stationId ||
      !slot ||
      isNaN(parseInt(stationId)) ||
      isNaN(parseInt(slot))
    ) {
      setScanned(false);
      return;
    }

    router.push({
      pathname: "/charge/start",
      params: {
        stationId: parseInt(stationId),
        slot: parseInt(slot),
      },
    });
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
    router.replace("/");
  };

  return (
    <AnimatedBackground>
      <SafeAreaView className="w-full min-h-screen gap-5 flex justify-center">
        <View className="gap-1 px-8">
          <Text className="text-primary text-3xl font-bold text-center">
            {hasPermission ? "Scan QR Code" : "Camera Access Required"}
          </Text>
          <Text className="text-muted-foreground text-center">
            {hasPermission
              ? "Scan the QR code displayed on the charging station in order to start charging."
              : "Please grant camera access to scan QR codes and start charging."}
          </Text>
        </View>
        <View className="aspect-square rounded-lg border-primary border-8 w-4/5 mx-auto mt-4 flex align-middle justify-center">
          {!scanned ? (
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              style={{ flex: 1 }}
            />
          ) : (
            <CameraOff className="mx-auto text-primary" size={80} />
          )}
        </View>
        <Separator className="w-3/5 mx-auto my-2" />
        <View className=" w-4/5 mx-auto">
          {scanned && (
            <Button onPress={() => setScanned(false)} className="mb-2">
              <Text>Scan Again</Text>
            </Button>
          )}

          <Button
            onPress={handleGoBack}
            variant={scanned ? "secondary" : "default"}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
};
