import { server } from "../../../lib/@axios";
import type {
  CarTypeDto,
  CarModelDto,
  CarModelWithTypeDto,
  AddCarModelRequest,
  EditCarModelRequest,
} from "../types/api";

// --- Car Types (Brands) ---

/**
 * GET api/carmanagement/GetAllCarTypes
 * No query params.
 */
const getAllCarTypes = async (
  signal?: AbortSignal
): Promise<CarTypeDto[]> => {
  const { data } = await server.get<CarTypeDto[]>(
    "api/carmanagement/GetAllCarTypes",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/carmanagement/AddCarType
 * Body: { name: string }.
 */
const addCarType = async (
  body: { name: string },
  signal?: AbortSignal
): Promise<void> => {
  await server.post("api/carmanagement/AddCarType", body, { signal });
};

/**
 * PUT api/carmanagement/UpdateCarType/{id}
 * Body: { name: string }.
 */
const updateCarType = async (
  id: number,
  body: { name: string },
  signal?: AbortSignal
): Promise<void> => {
  await server.put(`api/carmanagement/UpdateCarType/${id}`, body, { signal });
};

/**
 * DELETE api/carmanagement/DeleteCarType/{id}
 */
const deleteCarType = async (
  id: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(`api/carmanagement/DeleteCarType/${id}`, { signal });
};

// --- Car Models ---

/**
 * GET api/carmanagement/GetAllCarModels
 * No query = full list grouped by type (CarModelWithTypeDto[]).
 */
const getAllCarModels = async (
  signal?: AbortSignal
): Promise<CarModelWithTypeDto[]> => {
  const { data } = await server.get<CarModelWithTypeDto[]>(
    "api/carmanagement/GetAllCarModels",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * GET api/carmanagement/GetAllCarModels?carTypeId={typeId}
 * Returns flat CarModelDto[] for that type.
 */
const getCarModelsByType = async (
  carTypeId: number,
  signal?: AbortSignal
): Promise<CarModelDto[]> => {
  const { data } = await server.get<CarModelDto[]>(
    "api/carmanagement/GetAllCarModels",
    { params: { carTypeId }, signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/carmanagement/AddCarModel
 * Body: { name, carTypeId }.
 */
const addCarModel = async (
  body: AddCarModelRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.post("api/carmanagement/AddCarModel", body, { signal });
};

/**
 * PUT api/carmanagement/UpdateCarModel/{id}
 * Body: { name, carTypeId }.
 */
const updateCarModel = async (
  id: number,
  body: EditCarModelRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(`api/carmanagement/UpdateCarModel/${id}`, body, { signal });
};

/**
 * DELETE api/carmanagement/DeleteCarModel/{id}
 */
const deleteCarModel = async (
  id: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(`api/carmanagement/DeleteCarModel/${id}`, { signal });
};

export {
  getAllCarTypes,
  addCarType,
  updateCarType,
  deleteCarType,
  getAllCarModels,
  getCarModelsByType,
  addCarModel,
  updateCarModel,
  deleteCarModel,
};
