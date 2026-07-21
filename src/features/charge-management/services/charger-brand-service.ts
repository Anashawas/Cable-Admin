import { server } from "../../../lib/@axios";
import type { ChargerBrandDto } from "../types/api";

/** GET /api/charger-brands/GetAllChargerBrands (public) — for dropdowns. */
export const getAllChargerBrands = async (signal?: AbortSignal): Promise<ChargerBrandDto[]> => {
  const { data } = await server.get<ChargerBrandDto[]>("api/charger-brands/GetAllChargerBrands", { signal });
  return Array.isArray(data) ? data : [];
};

/** POST /api/charger-brands/AddChargerBrand (admin) — duplicates rejected. */
export const addChargerBrand = async (name: string): Promise<number> => {
  const { data } = await server.post<number>("api/charger-brands/AddChargerBrand", { name });
  return data;
};

/** PUT /api/charger-brands/UpdateChargerBrand/{id} (admin) — renames + syncs stations. */
export const updateChargerBrand = async (id: number, name: string): Promise<void> => {
  await server.put(`api/charger-brands/UpdateChargerBrand/${id}`, { name });
};

/** DELETE /api/charger-brands/DeleteChargerBrand/{id} (admin) — 400 if any station uses it. */
export const deleteChargerBrand = async (id: number): Promise<void> => {
  await server.delete(`api/charger-brands/DeleteChargerBrand/${id}`);
};
