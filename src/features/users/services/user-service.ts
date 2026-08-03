import { server } from "../../../lib/@axios";
import type {
  UserSummaryDto,
  UserDetailDto,
  UpdateUserRequestSpec,
  CreateUserRequest,
  UsersPage,
  UsersSummaryDto,
} from "../types/api";

/**
 * GET api/users/GetAllUsers
 * Supports optional query params: deletedOnly, includeDeleted.
 */
const getUsersList = async (
  signal?: AbortSignal,
  params?: { deletedOnly?: boolean; includeDeleted?: boolean }
): Promise<UserSummaryDto[]> => {
  const { data } = await server.get<UserSummaryDto[]>(
    "api/users/GetAllUsers",
    { signal, params }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * A2a — GET api/users/GetAllUsers with paging params → paged envelope.
 * search (name/email/phone/id), roleId, city, isDeleted, sort, page, pageSize.
 */
const getUsersPaged = async (
  params: {
    search?: string;
    roleId?: number;
    city?: string;
    isDeleted?: boolean;
    sort?: string;
    page?: number;
    pageSize?: number;
  },
  signal?: AbortSignal
): Promise<UsersPage> => {
  const { data } = await server.get<UsersPage>("api/users/GetAllUsers", { signal, params });
  return data;
};

/** A1 — GET api/users/summary aggregate. */
const getUsersSummary = async (signal?: AbortSignal): Promise<UsersSummaryDto> => {
  const { data } = await server.get<UsersSummaryDto>("api/users/summary", { signal });
  return data;
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

/**
 * PATCH api/users/restore
 * Body: { userIds: number[] }
 */
const restoreUsers = async (
  ids: number[],
  signal?: AbortSignal
): Promise<void> => {
  await server.patch("api/users/restore", { ids }, { signal });
};

/**
 * PATCH api/users/mark-update-notes-read
 * Marks update notes as read for the current user.
 */
const markUpdateNotesRead = async (
  signal?: AbortSignal
): Promise<void> => {
  await server.patch("api/users/mark-update-notes-read", null, { signal });
};

export {
  getUsersList,
  getUsersPaged,
  getUsersSummary,
  getUserById,
  updateUserProfile,
  deleteUserById,
  createUser,
  changeUserPassword,
  changeUserPhone,
  restoreUsers,
  markUpdateNotesRead,
};
