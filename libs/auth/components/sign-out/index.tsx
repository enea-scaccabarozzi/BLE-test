import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AnimatePresence } from "moti";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@app/shared/components/animated-background";
import { Button } from "@app/shared/components/button";
import { Text } from "@app/shared/components/text";
import { useToast } from "@app/shared/hooks/use-toast";
import { LogOut } from "@app/shared/icons/log-out";
import { AppErrorType, AppResultAsync } from "@app/shared/types/errors";

interface IProps {
  onSubmit: () => AppResultAsync<true>;
  onSuccess: () => void;
}

export const SignOutComponent = ({ onSubmit, onSuccess }: IProps) => {
  const { toast } = useToast();

  const handleSubmit = () => {
    // eslint-disable-next-line neverthrow/must-use-result
    onSubmit()
      .map(() => onSuccess())
      .mapErr((err) =>
        toast(
          err.type === AppErrorType.PublicError
            ? (err.publicDetails ?? err.publicMessage)
            : err.message,
          "destructive",
        ),
      );
  };
  return (
    <AnimatePresence exitBeforeEnter>
      <AnimatedBackground>
        <SafeAreaView className="h-screen w-screen">
          <View className="flex justify-center items-center flex-col p-5 h-full w-full">
            <View className="w-full flex items-center justify-center">
              <View className="aspect-square bg-primary w-16 rounded-xl border-solid border-4 border-primary shadow-2xl flex items-center justify-center">
                <LogOut height="73%" width="73%" className="text-white" />
              </View>
            </View>
            <Text className="text-3xl text-primary font-bold text-center my-2">
              You really want to leave?
            </Text>
            <Text className="font-normal text-muted-foreground text-center mb-5">
              You can log back in at any time with your email and password.
            </Text>
            <Button onPress={() => handleSubmit()} className="mb-3 w-full">
              <Text>Log out</Text>
            </Button>
            <Button
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              className="w-full"
              variant="secondary"
            >
              <Text>Cancel</Text>
            </Button>
            <StatusBar style="light" />
          </View>
        </SafeAreaView>
      </AnimatedBackground>
    </AnimatePresence>
  );
};
