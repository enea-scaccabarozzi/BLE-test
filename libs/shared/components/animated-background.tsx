import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";

import { BlobA } from "../assets/blobA";
import { BlobB } from "../assets/blobB";

interface IProps {
  children: React.ReactNode;
}

export const AnimatedBackground = ({ children }: IProps) => {
  return (
    <View className="bg-background relative min-h-screen min-w-screen">
      <MotiView
        className="absolute top-[-18%] left-[-38%] w-[90%] h-[80%]"
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          scale: {
            type: "timing",
            duration: 1000,
          },
          opacity: {
            type: "timing",
            duration: 1000,
          },
        }}
      >
        <BlobA opacity={0.3} width="100%" height="100%" />
      </MotiView>

      <MotiView
        className="absolute bottom-[-46%] right-[-22%] w-[90%] h-[80%]"
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          scale: {
            type: "timing",
            duration: 1000,
          },
          opacity: {
            type: "timing",
            duration: 1000,
          },
        }}
      >
        <BlobB opacity={0.3} width="100%" height="100%" />
      </MotiView>
      {children}
    </View>
  );
};
