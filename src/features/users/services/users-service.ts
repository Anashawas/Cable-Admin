import { server } from "../../../lib/@axios";
import {
  GetAllUsersRequest,
  GetUsersResponse,
  CreateUserRequest,
  UpdateUserRequest,
  User
} from "../types/api";

const getAllUsers = async (
  request: GetAllUsersRequest,
  signal?: AbortSignal
): Promise<GetUsersResponse> => {
  const response = await server.post<GetUsersResponse>(
    "/api/users/GetAllUsers",
    request,
    {
      signal,
      headers: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

const createUser = async (userData: CreateUserRequest): Promise<User> => {
  const response = await server.post<User>("/api/users", userData, {
    headers: {
      'Accept-Language': 'en',
      'Content-Type': 'application/json'
    }
  });

  return response.data;
};

const updateUser = async (id: number, userData: UpdateUserRequest): Promise<User> => {
  const response = await server.put<User>(`/api/users/${id}`, userData, {
    headers: {
      'Accept-Language': 'en',
      'Content-Type': 'application/json'
    }
  });

  return response.data;
};

const deleteUser = async (id: number): Promise<void> => {
  await server.delete(`/api/users/${id}`, {
    headers: {
      'Accept-Language': 'en',
    }
  });
};

export {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
