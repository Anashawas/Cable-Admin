import { server } from "@/lib/@axios";
import type {
  ServiceCategoryDto,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
  ServiceProviderDto,
  CreateServiceProviderRequest,
  UpdateServiceProviderRequest,
  ServiceProviderRatingDto,
  UploadFile,
  ChangeOwnerRequest,
} from "../types/api";

// ============================================
// Service Categories
// ============================================

export const getAllServiceCategories = async (): Promise<ServiceCategoryDto[]> => {
  const response = await server.get("/api/service-categories/GetAllServiceCategories");
  return response.data;
};

export const createServiceCategory = async (
  data: CreateServiceCategoryRequest
): Promise<number> => {
  const response = await server.post("/api/service-categories/CreateServiceCategory", data);
  return response.data;
};

export const updateServiceCategory = async (
  id: number,
  data: UpdateServiceCategoryRequest
): Promise<void> => {
  await server.put(`/api/service-categories/UpdateServiceCategory/${id}`, data);
};

// ============================================
// Service Providers
// ============================================

export const getAllServiceProviders = async (
  categoryId?: number
): Promise<ServiceProviderDto[]> => {
  const response = await server.get("/api/service-providers/GetAllServiceProviders", {
    params: categoryId ? { categoryId } : undefined,
  });
  return response.data;
};

export const getServiceProviderById = async (id: number): Promise<ServiceProviderDto> => {
  const response = await server.get(`/api/service-providers/GetServiceProviderById/${id}`);
  return response.data;
};

export const getServiceProvidersByCategory = async (
  categoryId: number
): Promise<ServiceProviderDto[]> => {
  const response = await server.get(`/api/service-providers/GetByCategory/${categoryId}`);
  return response.data;
};

export const getNearbyServiceProviders = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<ServiceProviderDto[]> => {
  const response = await server.get("/api/service-providers/GetNearby", {
    params: { latitude, longitude, radiusKm },
  });
  return response.data;
};

export const createServiceProvider = async (
  data: CreateServiceProviderRequest
): Promise<number> => {
  const response = await server.post("/api/service-providers/CreateServiceProvider", data);
  return response.data;
};

export const updateServiceProvider = async (
  id: number,
  data: UpdateServiceProviderRequest
): Promise<void> => {
  await server.put(`/api/service-providers/UpdateServiceProvider/${id}`, data);
};

export const deleteServiceProvider = async (id: number): Promise<void> => {
  await server.delete(`/api/service-providers/DeleteServiceProvider/${id}`);
};

export const verifyServiceProvider = async (id: number): Promise<void> => {
  await server.put(`/api/service-providers/VerifyServiceProvider/${id}`);
};

// ============================================
// Service Provider Ratings
// ============================================

export const getServiceProviderRatings = async (
  serviceProviderId: number
): Promise<ServiceProviderRatingDto[]> => {
  const response = await server.get(`/api/service-providers/GetRatings/${serviceProviderId}`);
  return response.data;
};

// ============================================
// Service Provider Attachments
// ============================================

export const getServiceProviderAttachments = async (id: number): Promise<UploadFile[]> => {
  const response = await server.get(`/api/service-providers/GetAttachments/${id}`);
  return response.data;
};

export const uploadServiceProviderIcon = async (id: number, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  await server.post(`/api/service-providers/UploadServiceProviderIcon/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const addServiceProviderAttachments = async (
  id: number,
  files: File[]
): Promise<number[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await server.post(`/api/service-providers/AddAttachments/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteServiceProviderAttachments = async (id: number): Promise<void> => {
  await server.delete(`/api/service-providers/DeleteAttachments/${id}`);
};

export const changeServiceProviderOwner = async (
  serviceProviderId: number,
  data: ChangeOwnerRequest
): Promise<void> => {
  await server.patch(`/api/provider/service-providers/change-owner/${serviceProviderId}`, data);
};
