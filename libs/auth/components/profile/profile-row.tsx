import { View } from "react-native";

import { Avatar, AvatarFallback } from "@app/shared/components/avatar";
import { Text } from "@app/shared/components/text";

interface IProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

export const ProfileRow = ({ label, value, icon }: IProps) => {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1 flex-row gap-3">
        <Avatar alt="mail">
          <AvatarFallback className="p-1">{icon}</AvatarFallback>
        </Avatar>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-foreground">
            {label}
          </Text>
          <Text numberOfLines={1} className="text-muted-foreground">
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
};
