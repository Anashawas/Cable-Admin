import { server } from "../../../lib/@axios";
import type {
  UserSummaryDto,
  UserDetailDto,
  UpdateUserRequestSpec,
  CreateUserRequest,
} from "../types/api";

/**
 * GET api/users/GetAllUsers
 * No query params. Returns full list; client-side search/paging.
 */
const getUsersList = async (
  signal?: AbortSignal
): Promise<UserSummaryDto[]> => {
  const { data } = await server.get<UserSummaryDto[]>(
    "api/users/GetAllUsers",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * GET api/users/GetUserById/{id}
 * Used to fill Edit User form.
 */
const getUserById = async (
  id: number,
  signal?: AbortSignal
): Promise<UserDetailDto> => {
  const { data } = await server.get<UserDetailDto>(
    `api/users/GetUserById/${id}`,
    { signal }
  );
  return data;
};

/**
 * PUT api/users/{id}
 * Body: UpdateUserRequestSpec (includes isActive, roleId). No password.
 */
const updateUserProfile = async (
  id: number,
  body: UpdateUserRequestSpec,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(`api/users/${id}`, body, { signal });
};

/**
 * DELETE api/users/{id}
 * No body.
 */
const deleteUserById = async (
  id: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(`api/users/${id}`, { signal });
};

/**
 * POST api/users/AddUser
 * Admin creates a new user with role, password, etc.
 */
const createUser = async (
  body: CreateUserRequest,
  signal?: AbortSignal
): Promise<number> => {
  const { data } = await server.post<number>("api/users/AddUser", body, { signal });
  return data;
};

/**
 * PATCH api/users/{id}/change-password
 * Body: { password: string }
 * Admin sets a new password for the given user.
 */
const changeUserPassword = async (
  id: number,
  password: string,
  signal?: AbortSignal
): Promise<void> => {
  await server.patch(`api/users/${id}/change-password`, { password }, { signal });
};

/**
 * PATCH api/users/{id}/change-phone
 * Body: { phoneNumber: string }
 * Admin sets a new phone number for the given user.
 */
const changeUserPhone = async (
  id: number,
  phoneNumber: string,
  signal?: AbortSignal
): Promise<void> => {
  await server.patch(`api/users/${id}/change-phone`, { phoneNumber }, { signal });
};

export { getUsersList, getUserById, updateUserProfile, deleteUserById, createUser, changeUserPassword, changeUserPhone };
