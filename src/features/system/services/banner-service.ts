import { server } from "../../../lib/@axios";
import { compressImage } from "../../../lib/image-compress";
import type { BannerDto, AddBannerRequest, UpdateBannerRequest } from "../types/api";

/**
 * GET api/banners/GetAllBanners
 * No query params. Returns array of BannerDto.
 */
const getAllBanners = async (
  signal?: AbortSignal
): Promise<BannerDto[]> => {
  const { data } = await server.get<BannerDto[]>(
    "api/banners/GetAllBanners",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/banners/AddBanner
 * Metadata only (no image). Returns new banner ID (number or array like [1]).
 */
const addBanner = async (
  body: AddBannerRequest,
  signal?: AbortSignal
): Promise<number> => {
  const { data } = await server.post<number | number[]>(
    "api/banners/AddBanner",
    body,
    { signal }
  );
  if (Array.isArray(data) && data.length > 0) return data[0];
  if (typeof data === "number") return data;
  throw new Error("Unexpected add banner response");
};

/**
 * POST api/bannerAttachment/AddBanner/{bannerId}
 * Form key: files. One image file.
 */
const uploadBannerImage = async (
  bannerId: number,
  file: File,
  signal?: AbortSignal
): Promise<void> => {
  // Banners are full-width photos — resize to 1600px + JPEG so they load fast.
  const light = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
  const form = new FormData();
  form.append("files", light);
  await server.post(
    `api/bannerAttachment/AddBanner/${bannerId}`,
    form,
    { signal }
  );
};

/**
 * PUT api/banners/UpdateBanner/{bannerId}
 * Updates banner metadata (name, phone, email, action, dates). Does NOT change
 * the image or location targeting — those are not part of this endpoint.
 */
const updateBanner = async (
  bannerId: number,
  body: UpdateBannerRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(
    `api/banners/UpdateBanner/${bannerId}`,
    body,
    { signal }
  );
};

/**
 * DELETE api/banners/DeleteBanner/{bannerId}
 */
const deleteBanner = async (
  bannerId: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(
    `api/banners/DeleteBanner/${bannerId}`,
    { signal }
  );
};

export { getAllBanners, addBanner, uploadBannerImage, updateBanner, deleteBanner };
