import React, { useEffect, useState } from "react";

import { appErrAsync } from "@app/shared/errors";
import { useHttp } from "@app/shared/hooks/use-http";
import { useStorageState } from "@app/shared/hooks/use-storage";
import { User } from "@app/shared/types/users";

import { useAuthService } from "../services/auth";
import { AuthContextShape } from "../types/context";

export const AuthContext = React.createContext<AuthContextShape>({
  signIn: () => appErrAsync({ message: "Not Ready Yet" }),
  signOut: () => appErrAsync({ message: "Not Ready Yet" }),
  session: null,
  profile: null,
  isLoading: false,
});

export function SessionProvider(props: React.PropsWithChildren) {
  const [profile, setProfile] = useState<User | null>(null);
  const [[isSessionLoading, session], setSession] = useStorageState("session");
  const [isLoading, setIsLoading] = useState(false);

  const authService = useAuthService();
  const { setAuthorization } = useHttp();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const profile = await authService.profile().unwrapOr(null);

      setProfile(profile);
      if (!profile) {
        setSession(null);
      }

      setIsLoading(false);
    };

    if (session && isSessionLoading === false) {
      setAuthorization(session);
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isSessionLoading]);

  return (
    <AuthContext.Provider
      value={{
        signIn: (mail: string, password: string) => {
          setIsLoading(true);
          return authService
            .login(mail.toLowerCase(), password)
            .andTee(setSession)
            .map(() => true);
        },
        signOut: () => {
          return authService
            .logout()
            .andTee(() => setSession(null))
            .map(() => true);
        },
        session,
        profile,
        isLoading: isSessionLoading ? true : isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
