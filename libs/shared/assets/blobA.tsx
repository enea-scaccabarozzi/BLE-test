import * as React from "react";
import Svg, { Path } from "react-native-svg";

type IProps = React.ComponentProps<typeof Svg>;

export const BlobA = (props: IProps) => (
  <Svg viewBox="98.97 132.18 290.38 309.77" {...props}>
    <Path
      fill="#f97316"
      d="M363.5 267q-30.5 27-22 95T295 440q-55 10-91.5-32t-23-91.5q13.5-49.5-49.5-63t-2-28q61-14.5 59-46.5t25-24q27 8 61-12t71.5-3q37.5 17 43 58.5t-25 68.5Z"
    />
  </Svg>
);

BlobA.displayName = "BlobA";
