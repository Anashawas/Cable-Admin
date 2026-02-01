// Request (api/users/authenticate)
export interface LoginCredentials {
  email: string;
  password: string;
}

// Response (success) — matches LoginResponseModel.kt
export interface LoginResponse {
  userDetails: UserDetails;
  accessToken: string;
  refreshToken: string;
  isCompletedData: boolean;
  privileges?: string[];
}

export interface UserDetails {
  id: number;
  name: string;
  phone?: string | null;
  isActive: boolean;
  email: string;
  registrationProvider?: string | null;
  firebaseUId?: string | null;
  country?: string | null;
  city?: string | null;
  role: { id: number; name: string };
  userCars?: UserCarType[];
}

export interface UserCarType {
  carTypeId: number;
  carTypeName: string;
  carModels: UserCarModel[];
}

export interface UserCarModel {
  userCarId?: number | null;
  carModelId: number;
  carModelName: string;
  plugTypes: { id: number; name: string; serialNumber?: string | null };
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
}
