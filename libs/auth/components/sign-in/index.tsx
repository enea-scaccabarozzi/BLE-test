import { AnimatePresence } from "moti";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@app/shared/components/animated-background";
import { AppResultAsync } from "@app/shared/types/errors";

import { SigninForm } from "./form";
import { LoginHeader } from "./header";

interface IProps {
  onSubmit: (email: string, password: string) => AppResultAsync<true>;
  onSuccess: () => void;
}

export const SignInComponent = ({ onSubmit, onSuccess }: IProps) => {
  const [stage, setStage] = useState<1 | 2>(1);

  return (
    <AnimatePresence exitBeforeEnter>
      <AnimatedBackground>
        <SafeAreaView className="h-screen w-screen flex align-center justify-center min-w-0">
          {stage === 1 ? (
            <LoginHeader
              title="Welcome Back!"
              subtitle="Before we begin, remind us of your email..."
              key={1}
            />
          ) : (
            <LoginHeader
              title="One Last Step..."
              subtitle="Enter your password, it will be used to confirm your identity!"
              key={2}
            />
          )}
          <View className="w-[80%] flex align-center justify-center mx-auto">
            <SigninForm
              onSubmit={onSubmit}
              onSuccess={onSuccess}
              stage={stage}
              setStage={setStage}
            />
          </View>
        </SafeAreaView>
      </AnimatedBackground>
    </AnimatePresence>
  );
};
