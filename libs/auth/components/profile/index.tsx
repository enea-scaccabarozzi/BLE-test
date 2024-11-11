import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "@app/shared/components/animated-background";
import { Button } from "@app/shared/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@app/shared/components/card";
// import { Label } from "@app/shared/components/label";
import { Separator } from "@app/shared/components/separator";
// import { Switch } from "@app/shared/components/switch";
import { Text } from "@app/shared/components/text";
import { useColorScheme } from "@app/shared/hooks/use-color-scheme";
import { BookUser } from "@app/shared/icons/book-user";
import { IdCard } from "@app/shared/icons/id-card";
import { Info } from "@app/shared/icons/info";
import { Mail } from "@app/shared/icons/mail";
import { User } from "@app/shared/types/users";
import { toTitleCase } from "@app/shared/utils/titlecase";

import { ProfileRow } from "./profile-row";

interface IProps {
  profile: User;
}

export const ProfileComponent = ({ profile }: IProps) => {
  //   const { colorScheme, setColorScheme } = useColorScheme();

  //   const toogleColorScheme = () => {
  //     setColorScheme(colorScheme === "dark" ? "light" : "dark");
  //   };

  const handleLogout = () => {
    router.push("/auth/signout");
  };

  const handleCancel = () => {
    if (router.canGoBack()) router.back();
    else router.push("/");
  };

  return (
    <AnimatedBackground>
      <SafeAreaView className="p-4 min-h-screen flex justify-center">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <View className="flex-row gap-3">
              <CardTitle className="pt-1">Profile</CardTitle>
            </View>
            <CardDescription>
              Manage your settings and profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <ProfileRow
              label="Mail"
              value={profile.email.toLowerCase()}
              icon={<Mail className="text-primary" size={18} />}
            />
            <ProfileRow
              label="Username"
              value={profile.username}
              icon={<Info className="text-primary" size={18} />}
            />
            <ProfileRow
              label="Full Name"
              value={`${toTitleCase(profile.name)} ${toTitleCase(profile.surname)}`}
              icon={<BookUser className="text-primary" size={18} />}
            />
            <ProfileRow
              label="Fiscal Code"
              value={profile.fiscalCode.toUpperCase()}
              icon={<IdCard className="text-primary" size={18} />}
            />

            {/* <Separator className="my-4" />
            <View className="flex-row flex gap-3">
              <Label nativeID="dark-mode" onPress={() => toogleColorScheme()}>
                Dark Mode
              </Label>
              <Switch
                checked={colorScheme === "dark"}
                onCheckedChange={toogleColorScheme}
                nativeID="dark-mode"
              />
            </View> */}

            <Separator className="my-4" />

            <Button onPress={handleLogout}>
              <Text>Logout</Text>
            </Button>
            <Button onPress={handleCancel} variant="secondary">
              <Text>Go Back</Text>
            </Button>
          </CardContent>
        </Card>
      </SafeAreaView>
    </AnimatedBackground>
  );
};
