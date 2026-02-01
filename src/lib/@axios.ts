import { refreshAccess } from "../features/authentication/services/authentication-service";
import { useAuthenticationStore, useLanguageStore } from "../stores";
import axios from "axios";
const server = axios.create({
  baseURL: window.env.server.url,
});

/** Login/authenticate: no token — we send empty when not logged in. Token comes from login response. */
const isAuthEndpoint = (url: string) => {
  const path = (url || "").toLowerCase();
  return path.includes("authenticate") || path.includes("login-by-token");
};

server.interceptors.request.use(
  (config) => {
    const { user } = useAuthenticationStore.getState();
    config.headers["Access-Control-Allow-Origin"] = "*";
    config.headers["accept-language"] = useLanguageStore.getState().language;
    // No Authorization on login (empty). After login we use the token from the API response.
    if (!isAuthEndpoint(config.url || "")) {
      const currentUserAccessToken = user?.accessToken;
      if (currentUserAccessToken && currentUserAccessToken !== "") {
        config.headers["Authorization"] = "Bearer " + currentUserAccessToken;
      }
    }
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

const shouldThrowError = (axiosError: any) => {
  const url = axiosError.config.url.toLowerCase();
  if (
    url.includes("authenticate") ||
    url.includes("refresh-access") ||
    axiosError.config._retry ||
    !axiosError.response ||
    axiosError.response.status !== 401
  ) {
    return true;
  }
  return false;
};

server.interceptors.response.use(
  async (response) => response,
  async (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger

    const { user, setTokens, logout } = useAuthenticationStore.getState();
    if (shouldThrowError(error)) {
      if (error.response?.status === 403) {
        logout();
      }
      return Promise.reject(error);
    }

    const orginalRequestConfiguration = error.config;

    orginalRequestConfiguration._retry = true;

    try {
      const refreshResponse = await refreshAccess(user!.refreshToken);

      if (
        refreshResponse.status === 200 &&
        refreshResponse.data &&
        !refreshResponse.data.error
      ) {
        setTokens(
          refreshResponse.data.accessToken,
          refreshResponse.data.refreshToken
        );

        orginalRequestConfiguration.headers = {
          ...orginalRequestConfiguration.headers,
          Authorization: `Bearer ${refreshResponse.data.accessToken}`,
        };

        axios.defaults.headers.common["Authorization"] =
          "Bearer " + refreshResponse.data.accessToken;

        return axios(orginalRequestConfiguration);
      } else {
        // alert(`error in refresh response ${refreshResponse}`);
        logout();
        //return Promise.reject(refreshResponse.data.error);
      }
    } catch (error) {
      //alert(`Catched ${err}`);
      //return Promise.reject(error);
      logout();
    }

    return Promise.reject(error);
  }
);

export { server };
