interface IAnalyticEventBase {
  eventType:
    | "deviceConnect"
    | "deviceDisconnect"
    | "error"
    | "chargeStart"
    | "chargeStop"
    | "ping";

  eventData: object;
}

export interface IDeviceConnectEvent extends IAnalyticEventBase {
  eventType: "deviceConnect";
  eventData: {};
}

export interface IPingEvent extends IAnalyticEventBase {
  eventType: "ping";
  eventData: {};
}

export interface IDeviceDisconnectEvent extends IAnalyticEventBase {
  eventType: "deviceDisconnect";
  eventData: {};
}
export interface IErrorEvent extends IAnalyticEventBase {
  eventType: "error";
  eventData: {
    message: string;
    details: string | null;
  };
}

export interface IChargeStartEvent extends IAnalyticEventBase {
  eventType: "chargeStart";
  eventData: {
    chargingSlot: number;
    stationId: number;
  };
}

export interface IChargeStopEvent extends IAnalyticEventBase {
  eventType: "chargeStop";
  eventData: {
    chargingSlot: number;
    stationId: number;
    duration: number;
  };
}

export type IAnalyticEvent =
  | IDeviceConnectEvent
  | IDeviceDisconnectEvent
  | IErrorEvent
  | IChargeStartEvent
  | IChargeStopEvent
  | IPingEvent;
