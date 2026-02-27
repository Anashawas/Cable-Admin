// ============================================
// Service Category DTOs
// ============================================

export interface ServiceCategoryDto {
  id: number;
  name: string;
  nameAr: string | null;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateServiceCategoryRequest {
  name: string;
  nameAr?: string | null;
  description?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateServiceCategoryRequest {
  name: string;
  nameAr?: string | null;
  description?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

// ============================================
// Service Provider DTOs
// ============================================

export interface ServiceProviderDto {
  id: number;
  name: string;
  ownerId: number;
  ownerName: string;
  serviceCategoryId: number;
  serviceCategoryName: string;
  serviceCategoryNameAr: string | null;
  statusId: number;
  statusName: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  countryName: string | null;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  priceDescription: string | null;
  fromTime: string | null;
  toTime: string | null;
  methodPayment: string | null;
  visitorsCount: number;
  isVerified: boolean;
  hasOffer: boolean;
  offerDescription: string | null;
  service: string | null;
  icon: string | null;
  whatsAppNumber: string | null;
  websiteUrl: string | null;
  avgRating: number;
  rateCount: number;
  images: string[];
  createdAt: string;
}

export interface CreateServiceProviderRequest {
  name: string;
  serviceCategoryId: number;
  statusId: number;
  description?: string | null;
  phone?: string | null;
  ownerPhone?: string | null;
  address?: string | null;
  countryName?: string | null;
  cityName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: number | null;
  priceDescription?: string | null;
  fromTime?: string | null;
  toTime?: string | null;
  methodPayment?: string | null;
  hasOffer: boolean;
  offerDescription?: string | null;
  service?: string | null;
  icon?: string | null;
  note?: string | null;
  whatsAppNumber?: string | null;
  websiteUrl?: string | null;
}

export interface UpdateServiceProviderRequest {
  name: string;
  serviceCategoryId: number;
  statusId: number;
  description?: string | null;
  phone?: string | null;
  ownerPhone?: string | null;
  address?: string | null;
  countryName?: string | null;
  cityName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: number | null;
  priceDescription?: string | null;
  fromTime?: string | null;
  toTime?: string | null;
  methodPayment?: string | null;
  isVerified: boolean;
  hasOffer: boolean;
  offerDescription?: string | null;
  service?: string | null;
  icon?: string | null;
  note?: string | null;
  whatsAppNumber?: string | null;
  websiteUrl?: string | null;
}

// ============================================
// Service Provider Rating DTOs
// ============================================

export interface ServiceProviderRatingDto {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  avgRating: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateRatingRequest {
  rating: number;
  comment?: string | null;
}

// ============================================
// Upload File DTO
// ============================================

export interface UploadFile {
  fileName: string;
  contentType: string;
  filePath: string;
  fileExtension: string;
  fileSize: number;
}

// ============================================
// Change Owner DTO
// ============================================

export interface ChangeOwnerRequest {
  newOwnerId: number;
}
