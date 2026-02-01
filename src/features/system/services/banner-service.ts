import { server } from "../../../lib/@axios";
import type { BannerDto, AddBannerRequest } from "../types/api";

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
  const form = new FormData();
  form.append("files", file);
  await server.post(
    `api/bannerAttachment/AddBanner/${bannerId}`,
    form,
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

export { getAllBanners, addBanner, uploadBannerImage, deleteBanner };
