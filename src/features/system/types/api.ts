/** Duration range for a banner. */
export interface BannerDurationDto {
  id: number;
  startDate: string;
  endDate: string;
}

/** Attachment (image) for a banner. */
export interface BannerAttachmentDto {
  id: number;
  contentType: string;
  fileName: string;
  fileSize: number;
  fileExtension: string;
  filePath: string;
}

/** Banner list item from GET api/banners/GetAllBanners. */
export interface BannerDto {
  id: number;
  name: string;
  phone: string;
  bannerDurations: BannerDurationDto[];
  bannerAttachments: BannerAttachmentDto[];
}

/** Request body for POST api/banners/AddBanner. Dates: yyyy-MM-dd. No image. */
export interface AddBannerRequest {
  name: string;
  phone: string;
  email: string;
  startDate: string;
  endDate: string;
  actionType?: number | null;
  actionUrl?: string | null;
}

/** Version entry from GET api/systemversion/GetAllSystemVersions. */
export interface SystemVersionDto {
  id: number;
  platform: string;
  version: string;
  /** API may return string "true"/"false" or boolean. */
  updateForce: string | boolean;
}

/** Request body for POST api/systemversion/AddSystemVersion. */
export interface AddSystemVersionRequest {
  platform: string;
  version: string;
  forceUpdate: boolean;
}

/** Request body for PUT api/systemversion/UpdateSystemVersion. */
export interface UpdateSystemVersionRequest {
  id: number;
  platform: string;
  version: string;
  updateForce: boolean;
}

/** Request body for POST api/systemversion/CheckSystemVersion. */
export interface CheckSystemVersionRequest {
  platform: string;
  version: string;
}

// --- Global Car Management (car types/brands + car models) ---

/** Car type (brand) from GET api/carmanagement/GetAllCarTypes. */
export interface CarTypeDto {
  id: number;
  name: string;
}

/** Car model (flat) from GetCarModelsByType or inside CarModelWithTypeDto. */
export interface CarModelDto {
  id: number;
  name: string;
}

/** Car type with its models from GET api/carmanagement/GetAllCarModels (no query). */
export interface CarModelWithTypeDto {
  id: number;
  name: string;
  carModels: CarModelDto[];
}

/** Request body for POST api/carmanagement/AddCarModel. */
export interface AddCarModelRequest {
  name: string;
  carTypeId: number;
}

/** Request body for PUT api/carmanagement/UpdateCarModel/{id}. */
export interface EditCarModelRequest {
  name: string;
  carTypeId: number;
}

// --- Emergency Services ---

/** Emergency service list/detail from GET api/emergency-services/GetAllEmergencyServices. */
export interface EmergencyServiceDto {
  id: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  subscriptionType: number;
  priceDetails?: string | null;
  actionUrl?: string | null;
  openFrom?: string | null;
  openTo?: string | null;
  phoneNumber?: string | null;
  whatsAppNumber?: string | null;
  isActive: boolean;
  sortOrder: number;
}

/** Add/Update body (no id; id in URL for Update). */
export interface EmergencyServicePayload {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  subscriptionType: number;
  priceDetails?: string | null;
  actionUrl?: string | null;
  openFrom?: string | null;
  openTo?: string | null;
  phoneNumber?: string | null;
  whatsAppNumber?: string | null;
  isActive: boolean;
  sortOrder: number;
}

/** Attachment from upload; use filePath as imageUrl when updating service. */
export interface EmergencyServiceAttachmentDto {
  fileName: string;
  contentType: string;
  filePath: string;
  fileExtension: string;
  fileSize: number;
}
