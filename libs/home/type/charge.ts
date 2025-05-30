export type ChargeStatus =
  | {
      slot_id: number;
      status:
        | "charging"
        | "unavailable"
        | "available"
        | "ready"
        | "charged"
        | "closedoor"
        | "disconnected"
        | "charge_timeout";
      door: "open" | "closed";
      start_timestamp: string;
      end_timestamp?: string;
      voltage?: number;
      current?: number;
      mac_addr?: string;
      temperatureAlarm: boolean;
      threshDownlow: boolean;
      estimatedEnd?: string;
    }
  | false;
