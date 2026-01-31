import { server } from "../../../lib/@axios";
import { ChangePassword, LoginCredentials, LoginResponse } from "../types/api";

const authenticate = async (
  { username, password }: LoginCredentials,
  signal?: AbortSignal
): Promise<LoginResponse> => {
  return server.post(
    "/api/users/authenticate",
    {
      username,
      password,
    },
    { signal: signal }
  );

  // dummy
  // return new Promise<LoginResponse>((resolve) => {
  //   resolve({
  //     data: {
  //       id: 1,
  //       name: "John Doe",
  //       username: "johndoe",
  //       isActiveDirectory: false,
  //       accessToken: "dummy-access-token",
  //       refreshToken: "dummy-refresh-token",
  //       privileges: ["user"],
  //     },
  //   });
  // });
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
