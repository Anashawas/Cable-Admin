import { server } from "../../../lib/@axios";
import type {
  UserSummaryDto,
  UserDetailDto,
  UpdateUserRequestSpec,
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

export { getUsersList, getUserById, updateUserProfile, deleteUserById };
