import { SafeAreaView } from "react-native-safe-area-context";

import { Skeleton } from "../components/skeleton";

interface IProps {
  page: "home" | "sessions" | "overview" | "map";
}

export const LoadingScreen = ({ page }: IProps) => {
  if (page === "home")
    return (
      <SafeAreaView className="h-screen w-screen flex justify-center items-center p-5">
        <Skeleton className="w-[100%] h-[40%] mb-8" />

        <Skeleton className="w-[60%] h-10 mb-2" />

        <Skeleton className="w-[20%] h-4 mb-1" />
        <Skeleton className="w-[60%] h-4 mb-1" />
        <Skeleton className="w-[40%] h-4 mb-4" />

        <Skeleton className="w-[30%] h-4 mb-1" />
        <Skeleton className="w-[50%] h-4 mb-1" />
        <Skeleton className="w-[70%] h-4 mb-4" />

        <Skeleton className="w-[20%] h-4 mb-1" />
        <Skeleton className="w-[60%] h-4 mb-1" />
        <Skeleton className="w-[40%] h-4 mb-4" />
      </SafeAreaView>
    );

  if (page === "sessions")
    return (
      <SafeAreaView className="h-screen w-screen flex justify-center items-center p-5">
        <Skeleton className="w-[60%] h-10 mb-2 mt-5" />
        <Skeleton className="w-[70%] h-4 mb-8" />

        <Skeleton className="w-[90%] h-20 mb-4" />
        <Skeleton className="w-[90%] h-20 mb-4" />
        <Skeleton className="w-[90%] h-20 mb-4" />
        <Skeleton className="w-[90%] h-20 mb-4" />
      </SafeAreaView>
    );

  if (page === "overview")
    return (
      <SafeAreaView className="h-screen w-screen flex justify-center items-center p-5">
        <Skeleton className="w-[100%] h-[40%] mb-8 mt-[20%]" />

        <Skeleton className="w-[60%] h-6 mb-2" />

        <Skeleton className="w-[20%] h-4 mb-1" />
        <Skeleton className="w-[60%] h-4 mb-1" />
        <Skeleton className="w-[40%] h-4 mb-4" />
      </SafeAreaView>
    );

  if (page === "map")
    return (
      <SafeAreaView className="h-screen w-screen flex justify-center items-center p-5">
        <Skeleton className="w-[100%] h-[60%] mb-8" />

        <Skeleton className="w-[100%] h-[30%] mb-4" />
      </SafeAreaView>
    );

  return null;
};
