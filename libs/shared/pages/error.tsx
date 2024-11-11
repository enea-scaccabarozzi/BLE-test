import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components/button";
import { Text } from "../components/text";
import { Bug } from "../icons/bug";
import { AppError, AppErrorType } from "../types/errors";

const ERROR_PLACEHOLDERS = [
  "Oops! Hit a snag, but we're on it!",
  "Hmm, something's not right. Let's give it another shot.",
  "Whoa, we tripped up. Let's try that again.",
  "Uh-oh, we hit a bump. Hang tight, we're fixing it!",
  "Looks like we took a wrong turn. Rerouting now!",
  "Something went sideways. We're setting it straight!",
  "Oopsie daisy, that wasn't planned. Correcting course!",
  "Alert! We encountered a hiccup, but we're sorting it out.",
  "We've hit a little glitch. Patching it up as we speak!",
  "Blink and you'll miss it, we're resolving a tiny mishap!",
];

interface IProps {
  error?: AppError;
}

export const ErrorScreen = ({ error }: IProps) => {
  return (
    <View className="bg-background w-screen h-screen">
      <SafeAreaView className="w-full h-full flex items-center justify-center">
        <View className="aspect-square rounded-full bg-background shadow flex items-center justify-center p-5">
          <Bug height={48} color="red" />
        </View>
        <Text className="mt-4 w-[80%] mx-auto text-center text-sm italic">
          {
            ERROR_PLACEHOLDERS[
              Math.floor(Math.random() * ERROR_PLACEHOLDERS.length)
            ]
          }
        </Text>
        {error && (
          <Text className="mt-2 w-[80%] mx-auto text-center text-xs">
            {error.type === AppErrorType.PublicError ? (
              <View className="gap-1">
                <Text>{error.publicMessage}</Text>
                {error.publicDetails && <Text>{error.publicDetails}</Text>}
              </View>
            ) : (
              <Text>{error.message}</Text>
            )}
          </Text>
        )}
        <View className="mt-5">
          <Button
            variant="secondary"
            onPress={() => {
              router.replace("/");
            }}
          >
            <Text>Home</Text>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};
