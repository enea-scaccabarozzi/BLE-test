import { router } from "expo-router";

import { useToast } from "@app/shared/hooks/use-toast";

import { SignInComponent } from "../components/sign-in";
import { useSession } from "../hooks/use-session";

export const SignInPage = () => {
  const { signIn } = useSession();
  const { toast } = useToast();

  const handleSuccess = () => {
    router.replace("/");
    toast("Welcome Back!", "success");
  };

  return <SignInComponent onSubmit={signIn} onSuccess={handleSuccess} />;
};
