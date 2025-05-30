import { MotiView } from "moti";
import { View } from "react-native";

import { Text } from "@app/shared/components/text";
import { Bike } from "@app/shared/icons/bike";

interface IProps {
  remoteStatus: string;
  isConnected: boolean;
}

export const StatusIndicatorComponent = ({
  remoteStatus,
  isConnected,
}: IProps) => {
  const isCharging = remoteStatus === "charging" || remoteStatus === "charged";

  const statusMappings = {
    charging: "Charging",
    charged: "Fully Charged",
    closedoor: "Close Door",
    ready: "Close Door",
    disconnected: "Charge Aborted",
    charge_timeout: "Charge Timeout",
  };

  return (
    <View className="flex flex-col gap-3">
      <View className="flex items-center justify-center py-[80]">
        {[300, 250].map((size, index) => (
          <MotiView
            className="bg-primary"
            key={index}
            from={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{
              type: "timing",
              duration: 2000,
              repeat: Infinity,
              delay: index * 300, // Offset the start of each circle
            }}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
          />
        ))}
        <MotiView
          className="bg-primary"
          from={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            repeat: Infinity,
          }}
          style={{
            width: 180,
            height: 180,
            borderRadius: 180,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bike width={80} height={80} color="white" />
        </MotiView>
      </View>

      {/* Connection and charging status indicators */}
      <View className="flex flex-row gap-2 mx-auto justify-start mt-[-20]">
        <View
          className={`h-3 mt-[5] aspect-square rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
        />
        <Text>{isConnected ? "Connected" : "Not Connected"}</Text>
      </View>
      <View className="flex flex-row gap-2 mx-auto justify-start">
        <View
          className={`h-3 mt-[5] aspect-square rounded-full ${isCharging ? "bg-green-500" : "bg-red-500"}`}
        />
        <Text>
          {statusMappings[remoteStatus as keyof typeof statusMappings] ||
            "Not Charging"}
        </Text>
      </View>
    </View>
  );
};
