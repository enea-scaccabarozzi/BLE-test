import * as Haptics from "expo-haptics";
import { MotiView, useDynamicAnimation } from "moti";
import { ReactNode } from "react";
import { Pressable } from "react-native";

interface IProps {
  children: ReactNode;
  error?: boolean;
  onPress?: () => void;
}

export const HapticPressable = ({ children, error, onPress }: IProps) => {
  const animation = useDynamicAnimation(() => ({
    scale: 1,
  }));

  return (
    <Pressable
      onPressIn={() => {
        Haptics.notificationAsync(
          error
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Success,
        );
        animation.animateTo({
          scale: 0.8,
        });
      }}
      onPressOut={() => {
        animation.animateTo((current) => ({
          ...current,
          scale: 1,
        }));
      }}
      onPress={onPress}
    >
      <MotiView state={animation}>{children}</MotiView>
    </Pressable>
  );
};
