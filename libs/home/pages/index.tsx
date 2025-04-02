import { useQuery } from "@tanstack/react-query";

import { useBle } from "@app/ble/hooks/use-ble";
import { appErrAsync } from "@app/shared/errors";
import { ErrorScreen } from "@app/shared/pages/error";
import { LoadingScreen } from "@app/shared/pages/loading";
import { AppError } from "@app/shared/types/errors";

import { HomeComponent } from "../components";
import { useChargeService } from "../services/charge";
import { ChargeStatus } from "../type/charge";

export const HomePage = () => {
  const { fetchStatus, promiseAdapter, createDoorViolation } =
    useChargeService();
  const { dataMeasurements, isConnected, connect, disconnect } = useBle();

  const {
    isPending,
    error,
    data: chargeStatus,
  } = useQuery<ChargeStatus, AppError>({
    queryKey: ["chargeStatus"],
    queryFn: promiseAdapter(fetchStatus),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

  const handleConnect = () => {
    if (chargeStatus) {
      if (chargeStatus.end_timestamp === undefined) {
        return appErrAsync({
          publicMessage: "Please stop the charge before connecting",
        });
      }

      if (chargeStatus.status === "closedoor") {
        // const TEN_MINUTES_AGO = 10 * 60 * 1000;
        const TEN_MINUTES_AGO = 1000;
        const now = new Date().getTime();
        const endTime = new Date(chargeStatus.end_timestamp).getTime();
        const timeDiff = now - endTime;
        if (timeDiff > TEN_MINUTES_AGO) {
          return connect()
            .andThrough(() => createDoorViolation())
            .andThen(() =>
              appErrAsync({
                publicMessage:
                  "The device has been started with open door, it will be reported",
              }),
            );
        }
        return appErrAsync({
          publicMessage: "Please close the door before connecting",
        });
      }
    }
    return connect().map(() => true as const);
  };

  if (isPending) return <LoadingScreen page="home" />;

  if (error) return <ErrorScreen error={error} />;

  return (
    <HomeComponent
      deviceChargeStatus={chargeStatus}
      deviceData={dataMeasurements}
      isDeviceConnected={isConnected}
      logRawEnabled={(process.env.EXPO_PUBLIC_DEPLOY_STAGE || "dev") === "dev"}
      onConnect={handleConnect}
      onDisconnect={disconnect}
    />
  );
};
