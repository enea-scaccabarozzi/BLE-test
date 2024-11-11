import { AppResultAsync } from "@app/shared/types/errors";
import { User } from "@app/shared/types/users";

export type AuthContextShape = {
  signIn: (mail: string, password: string) => AppResultAsync<true>;
  signOut: () => AppResultAsync<true>;
  isLoading: boolean;
  session: string | null;
  profile: User | null;
};
