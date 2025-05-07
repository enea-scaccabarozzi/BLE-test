import axios, { AxiosInstance } from "axios";

type Environment = "dev" | "production";

// Utility function to create an AxiosInstance based on the deployment stage
function createApiClient(
  endpoints: Record<Environment, string>,
): AxiosInstance {
  const deployStage: Environment =
    (process.env.EXPO_PUBLIC_DEPLOY_STAGE as Environment) || "dev";
  const baseUrl = endpoints[deployStage];
  const instance = axios.create({ baseURL: baseUrl });
  return instance;
}

// Creating API clients for different aspects
const http = createApiClient({
  dev: "http://172.23.0.199:3000",
  production: "https://app.life2m.eu/api/v1",
});

// Hook providing access to different API clients and a method to set authorization headers
export const useHttp = () => {
  const setAuthorization = (token: string | null) => {
    http.defaults.headers.common.Authorization = token
      ? `Bearer ${token}`
      : undefined;
  };

  return {
    http,
    setAuthorization,
  };
};
