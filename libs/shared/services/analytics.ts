import { fromPromise } from "neverthrow";

import { createAppError } from "../errors";
import { useHttp } from "../hooks/use-http";
import { IAnalyticEvent } from "../types/analytics";
import { AppResultAsync } from "../types/errors";

export const useAnalyticsService = () => {
  const { http } = useHttp();

  const trackEvent = (data: IAnalyticEvent): AppResultAsync<true> => {
    return fromPromise(
      http.post<true>("/analytics/events", {
        eventData: JSON.stringify(data.eventData),
        eventType: data.eventType,
      }),
      () => {
        return createAppError({
          publicMessage: "Internal Server Error",
          publicDetails: "Unable to track analytics event",
        });
      },
    ).map(() => true);
  };

  return {
    trackEvent,
  };
};
