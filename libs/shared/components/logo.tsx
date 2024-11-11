import { View } from "react-native";

import { User } from "../icons/user";
import { cn } from "../utils/cn";

type IProps = React.ComponentPropsWithoutRef<typeof View>;

export const LogoComponent = ({ className, ...props }: IProps) => {
  return (
    <View
      className={cn(
        "aspect-square bg-primary w-16 rounded-xl border-solid border-4 border-primary shadow-2xl flex items-center justify-center",
        className,
      )}
      {...props}
    >
      <User height="73%" width="73%" className="text-white" />
    </View>
  );
};
