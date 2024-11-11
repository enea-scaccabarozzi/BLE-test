import { isAxiosError } from "axios";
import { fromPromise, okAsync } from "neverthrow";

import { createAppError } from "@app/shared/errors";
import { useHttp } from "@app/shared/hooks/use-http";
import { AppResultAsync } from "@app/shared/types/errors";
import { User } from "@app/shared/types/users";

export const useAuthService = () => {
  const { http } = useHttp();

  const login = (email: string, password: string): AppResultAsync<string> => {
    return fromPromise(
      http.post<{ access_token: string }>("/auth/login", {
        email,
        password,
      }),
      (err) => {
        return isAxiosError(err) && err.response?.status === 401
          ? createAppError({
              publicMessage: "Login Failed",
              publicDetails: "Invalid credentials",
            })
          : createAppError({
              publicMessage: "Login Failed",
              publicDetails: "Internal server error",
            });
      },
    ).map((res) => res.data.access_token);
  };

  const logout = (): AppResultAsync<true> => {
    return okAsync(true);
  };

  const profile = (): AppResultAsync<User> => {
    return fromPromise(http.get<User>("/me"), (err) =>
      isAxiosError(err) && err.response?.status === 401
        ? createAppError({
            publicMessage: "Profile Fetch Failed",
            publicDetails: "Unauthorized",
          })
        : createAppError({
            publicMessage: "Profile Fetch Failed",
            publicDetails: "Internal server error",
          }),
    ).map((res) => res.data);
  };

  return {
    login,
    logout,
    profile,
  };
};
