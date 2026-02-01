import { server } from "../../../lib/@axios";
import type {
  AddUserCarRequest,
  CarTypeWithModelsDto,
} from "../types/api";

export interface PlugTypeOption {
  id: number;
  name?: string | null;
  serialNumber?: string | null;
}

/**
 * GET api/carmanagement/GetAllCarModels
 * Returns brands/types with their car models (grouped dropdown).
 */
const getAllCarModels = async (
  signal?: AbortSignal
): Promise<CarTypeWithModelsDto[]> => {
  const { data } = await server.get<CarTypeWithModelsDto[]>(
    "api/carmanagement/GetAllCarModels",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * GET api/plug-types/GetAllPlugTypes
 * Same as in Add/Edit Charging Point. Use id as plugTypeId in AddUserCarRequest.
 */
const getAllPlugTypes = async (
  signal?: AbortSignal
): Promise<PlugTypeOption[]> => {
  const { data } = await server.get<PlugTypeOption[]>(
    "api/plug-types/GetAllPlugTypes",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/carmanagement/AddUserCar
 * Body: userId, carModelId, plugTypeId.
 */
const addUserCar = async (
  body: AddUserCarRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.post("api/carmanagement/AddUserCar", body, { signal });
};

/**
 * DELETE api/carmanagement/DeleteUserCar/{id}
 * id = carModelId from the user's car entry (userCars[].carModels[].carModelId).
 */
const deleteUserCar = async (
  carModelId: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(
    `api/carmanagement/DeleteUserCar/${carModelId}`,
    { signal }
  );
};

export { getAllCarModels, getAllPlugTypes, addUserCar, deleteUserCar };
