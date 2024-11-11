import { MotiView } from "moti";
import { View } from "react-native";

import { Text } from "@app/shared/components/text";
import { User } from "@app/shared/icons/user";

interface IProps {
  title: string;
  subtitle: string;
}

export const LoginHeader = ({ title, subtitle }: IProps) => {
  return (
    <MotiView
      from={{ translateX: -200, opacity: 0 }}
      exit={{ translateX: -200, opacity: 0 }}
      animate={{ translateX: 0, opacity: 1 }}
      transition={{
        translateX: {
          type: "spring",
          duration: 5000,
        },
        opacity: {
          type: "timing",
          duration: 1500,
        },
      }}
    >
      <View className="w-full flex items-center justify-center">
        <View className="aspect-square bg-primary w-16 rounded-xl border-solid border-4 border-primary shadow-2xl flex items-center justify-center">
          <User height="73%" width="73%" className="text-white" />
        </View>
      </View>
      <Text className="text-3xl font-bold text-primary mt-2 w-full text-center">
        {title}
      </Text>
      <Text className="text-sm text-muted-foreground w-full text-center italic mb-4">
        {subtitle}
      </Text>
    </MotiView>
  );
};
