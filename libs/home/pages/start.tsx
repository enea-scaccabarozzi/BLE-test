import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { createAppError } from "@app/shared/errors";
import { useToast } from "@app/shared/hooks/use-toast";
import { ErrorScreen } from "@app/shared/pages/error";
import { LoadingScreen } from "@app/shared/pages/loading";
import { AppError, AppErrorType } from "@app/shared/types/errors";

import { StartChargeComponent } from "../components/actions/start";
import { useChargeService } from "../services/charge";
import { ChargeStatus } from "../type/charge";

export const StartChargePage = () => {
  const [action, setAction] = useState<"openDoor" | "startCharge">("openDoor");
  const { stationId, slot } = useLocalSearchParams<{
    stationId?: string;
    slot?: string;
  }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { startCharge, promiseAdapter, openDoor, fetchStatus } =
    useChargeService();

  const handleMutationError = (err: AppError) => {
    toast(
      err.type === AppErrorType.PublicError
        ? err.publicDetails || err.publicMessage
        : "Unable to perform action, internal error",
      "destructive",
    );
  };

  const { mutate: openDoorMutate, isPending: isOpening } = useMutation({
    mutationFn: promiseAdapter(() =>
      openDoor(parseInt(stationId!), parseInt(slot!)),
    ),
    onSuccess: () => {
      toast("Door opened successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["chargeStatus"] });
      setAction("startCharge");
    },
    onError: handleMutationError,
  });

  const { mutate: startChargeMutate, isPending: isStarting } = useMutation({
    mutationFn: promiseAdapter(startCharge),
    onSuccess: () => {
      toast("Charge started successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["chargeStatus"] });
      setAction("openDoor");
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

  if (
    stationId === undefined ||
    slot === undefined ||
    isNaN(parseInt(stationId)) ||
    isNaN(parseInt(slot))
  )
    return (
      <ErrorScreen
        error={createAppError({
          publicMessage: "We are unable to rendere this route",
          publicDetails: "Recived invalid parameters",
        })}
      />
    );

  if (error) return <ErrorScreen error={error} />;

  if (isPending) return <LoadingScreen page="map" />;

  if (
    chargeStatus !== false &&
    (chargeStatus.status === "charged" ||
      chargeStatus.status === "charging" ||
      chargeStatus.status === "unavailable")
  )
    return (
      <ErrorScreen
        error={createAppError({
          publicMessage: "Unable to start charge",
          publicDetails:
            "It seems that the device is already on charge or the selected slot is unavailable",
        })}
      />
    );

  return (
    <StartChargeComponent
      openDoorMutate={openDoorMutate}
      startChargeMutate={startChargeMutate}
      stationId={parseInt(stationId)}
      slot={parseInt(slot)}
      action={action}
      isLoading={isOpening || isStarting}
    />
  );
};
