export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: {
    id: number;
    name: string;
    username: string;
    isActiveDirectory: boolean;
    accessToken: string;
    refreshToken: string;
    privileges: string[];
  };
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
}
