import * as React from "react";
import Svg, { Path } from "react-native-svg";

type IProps = React.ComponentProps<typeof Svg>;

export const BlobB = (props: IProps) => (
  <Svg viewBox="54.92 78.12 337.08 290.37" {...props}>
    <Path
      fill="#f97316"
      d="M388.5 286.5Q402 333 363 359t-81-19.5Q240 294 226 291t-35-7q-21-4-56-24t-67.5-79q-32.5-59 19-88T189 118.5q51 54.5 107-9t55.5 1.5q-.5 65 11.5 97t25.5 78.5Z"
    />
  </Svg>
);
