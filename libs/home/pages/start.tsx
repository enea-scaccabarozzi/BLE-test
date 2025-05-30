import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { createAppError } from "@app/shared/errors";
import { useToast } from "@app/shared/hooks/use-toast";
import { ErrorScreen } from "@app/shared/pages/error";
import { AppError, AppErrorType } from "@app/shared/types/errors";

import { StartChargeComponent } from "../components/actions/start";
import { useChargeService } from "../services/charge";

export const StartChargePage = () => {
  const [action, setAction] = useState<"openDoor" | "startCharge">("openDoor");
  const { stationId, slot } = useLocalSearchParams<{
    stationId?: string;
    slot?: string;
  }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { startCharge, promiseAdapter, openDoor } = useChargeService();

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

  return (
    <StartChargeComponent
      openDoorMutate={openDoorMutate}
      startChargeMutate={startChargeMutate}
      stationId={parseInt(stationId)}
      slot={parseInt(slot) + 1}
      action={action}
      isLoading={isOpening || isStarting}
    />
  );
};
