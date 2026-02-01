import { server } from "../../../lib/@axios";
import { ChangePassword, LoginCredentials, LoginResponse } from "../types/api";

const authenticate = async (
  { email, password }: LoginCredentials,
  signal?: AbortSignal
): Promise<LoginResponse> => {
  const { data } = await server.post<LoginResponse>(
    "api/users/authenticate",
    { email, password },
    { signal }
  );
  return data;
};

const refreshAccess = (token: string, signal?: AbortSignal) => {
  return server.post(
    "api/users/refresh-access",
    { token: token },
    { signal: signal }
  );
};

const changePassword = (
  { currentPassword, newPassword }: ChangePassword,
  signal?: AbortSignal
) => {
  return server.patch(
    "api/users/change-my-password",
    { currentPassword, newPassword },
    { signal: signal }
  );
};

const loginByAuthorizationToken = (signal: AbortSignal) => {
  return server.post("api/users/login-by-token", null, { signal: signal });
};

export {
  authenticate,
  refreshAccess,
  changePassword,
  loginByAuthorizationToken,
};
