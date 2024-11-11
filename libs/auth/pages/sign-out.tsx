import { router } from "expo-router";

import { useToast } from "@app/shared/hooks/use-toast";

import { SignOutComponent } from "../components/sign-out";
import { useSession } from "../hooks/use-session";

export const SignOutPage = () => {
  const { signOut } = useSession();
  const { toast } = useToast();

  const handleSuccess = () => {
    router.replace("/");
    toast("See you soon!", "success");
  };

  return <SignOutComponent onSubmit={signOut} onSuccess={handleSuccess} />;
};
