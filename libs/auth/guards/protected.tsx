import { Redirect } from "expo-router";

import { LoadingScreen } from "@app/shared/pages/loading";

import { useSession } from "../hooks/use-session";

interface IProps {
  children: React.ReactNode;
}

export const Protected = ({ children }: IProps) => {
  const { session, isLoading } = useSession();

  if (isLoading) return <LoadingScreen page="home" />;

  if (!session) return <Redirect href="/signin" />;

  return children;
};
