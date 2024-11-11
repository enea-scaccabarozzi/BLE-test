import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import { createAppError } from "@app/shared/errors";
import { useToast } from "@app/shared/hooks/use-toast";
import { ErrorScreen } from "@app/shared/pages/error";
import { LoadingScreen } from "@app/shared/pages/loading";
import { AppError, AppErrorType } from "@app/shared/types/errors";

import { StopChargeComponent } from "../components/actions/stop";
import { useChargeService } from "../services/charge";
import { ChargeStatus } from "../type/charge";

export const StopChargePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { stopCharge, promiseAdapter, fetchStatus } = useChargeService();

  const handleMutationError = (err: AppError) => {
    toast(
      err.type === AppErrorType.PublicError
        ? err.publicDetails || err.publicMessage
        : "Unable to stop charge, internal error",
      "destructive",
    );
  };

  const { mutate: stopChargeMutate, isPending: isStopping } = useMutation({
    mutationFn: promiseAdapter(() => stopCharge()),
    onSuccess: () => {
      toast("Charge stopped correctly", "success");
      queryClient.invalidateQueries({ queryKey: ["chargeStatus"] });
      router.replace("/");
    },
    onError: handleMutationError,
  });

  const {
    data: chargeStatus,
    isPending,
    error,
  } = useQuery<ChargeStatus, AppError>({
    queryKey: ["chargeStatus"],
    queryFn: promiseAdapter(fetchStatus),
  });

  if (error) return <ErrorScreen error={error} />;

  if (isPending) return <LoadingScreen page="map" />;

  if (
    chargeStatus === false ||
    chargeStatus.status === "available" ||
    chargeStatus.status === "ready"
  )
    return (
      <ErrorScreen
        error={createAppError({
          publicMessage: "Unable to stop charge",
          publicDetails:
            "It seems that the device is not yet on charge or the station is unavailable",
        })}
      />
    );

  return (
    <StopChargeComponent
      stopChargeMutate={stopChargeMutate}
      isLoading={isStopping}
    />
  );
};
