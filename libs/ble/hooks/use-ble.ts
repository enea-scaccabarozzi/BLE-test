import { useContext } from "react";

import { BleContext } from "../contexts/ble";

export function useBle() {
  const value = useContext(BleContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useBle must be wrapped in a <BleContext />");
    }
  }

  return value;
}
