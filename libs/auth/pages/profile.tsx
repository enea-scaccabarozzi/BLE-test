import { ErrorScreen } from "@app/shared/pages/error";

import { ProfileComponent } from "../components/profile";
import { useSession } from "../hooks/use-session";

export const ProfilePage = () => {
  const { profile } = useSession();

  if (!profile) return <ErrorScreen />;

  return <ProfileComponent profile={profile} />;
};
