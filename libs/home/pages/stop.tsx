import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import { useToast } from "@app/shared/hooks/use-toast";
import { AppError, AppErrorType } from "@app/shared/types/errors";

import { StopChargeComponent } from "../components/actions/stop";
import { useChargeService } from "../services/charge";

export const StopChargePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { stopCharge, promiseAdapter } = useChargeService();

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

  return (
    <StopChargeComponent
      stopChargeMutate={stopChargeMutate}
      isLoading={isStopping}
    />
  );
};
