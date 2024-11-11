import type { SlottableViewProps, ViewRef } from "../types";

type RootProps = SlottableViewProps & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
};

type RootRef = ViewRef;

export type { RootProps, RootRef };
