import { useQuery } from "@tanstack/react-query";

import { useBle } from "@app/ble/hooks/use-ble";
import { ErrorScreen } from "@app/shared/pages/error";
import { LoadingScreen } from "@app/shared/pages/loading";
import { AppError } from "@app/shared/types/errors";

import { HomeComponent } from "../components";
import { useChargeService } from "../services/charge";
import { ChargeStatus } from "../type/charge";

export const HomePage = () => {
  const { fetchStatus, promiseAdapter } = useChargeService();
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

  if (isPending) return <LoadingScreen page="home" />;

  if (error) return <ErrorScreen error={error} />;

  return (
    <HomeComponent
      deviceChargeStatus={chargeStatus}
      deviceData={dataMeasurements}
      isDeviceConnected={isConnected}
      logRawEnabled={(process.env.EXPO_PUBLIC_DEPLOY_STAGE || "dev") === "dev"}
      onConnect={() => connect().map(() => true)}
      onDisconnect={disconnect}
    />
  );
};
