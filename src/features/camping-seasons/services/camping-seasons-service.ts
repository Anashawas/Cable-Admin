import { server } from "../../../lib/@axios";
import {
  GetAllCampingSeasonsRequest,
  GetAllCampingSeasonsResponse,
  CreateCampingSeasonRequest,
  UpdateCampingSeasonRequest,
  CampingSeason
} from "../types/api";

const getAllCampingSeasons = async (
  params: GetAllCampingSeasonsRequest = {
    name: null,
    fromDate: null,
    toDate: null,
    includeDeleted: false,
  },
  signal?: AbortSignal
): Promise<GetAllCampingSeasonsResponse> => {
  const response = await server.post<GetAllCampingSeasonsResponse>(
    "/api/camping-seasons/GetAllCampingSeasons",
    params,
    {
      signal,
      headers: {
        "Accept-Language": "en",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

const createCampingSeason = async (
  seasonData: CreateCampingSeasonRequest
): Promise<CampingSeason> => {
  const response = await server.post<CampingSeason>(
    "/api/camping-seasons/AddCampingSeason",
    seasonData,
    {
      headers: {
        "Accept-Language": "en",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

const updateCampingSeason = async (
  id: number,
  seasonData: UpdateCampingSeasonRequest
): Promise<CampingSeason> => {
  const response = await server.put<CampingSeason>(
    `/api/camping-seasons/UpdateCampingSeason/${id}`,
    seasonData,
    {
      headers: {
        "Accept-Language": "en",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

const getCampingSeasonById = async (
  id: number,
  signal?: AbortSignal
): Promise<CampingSeason> => {
  const response = await server.post<CampingSeason>(
    "/api/camping-seasons/GetCampingSeasonById",
    { id },
    {
      signal,
      headers: {
        "Accept-Language": "en",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

const deleteCampingSeason = async (id: number): Promise<void> => {
  await server.delete(`/api/camping-seasons/DeleteCampingSeason/${id}`, {
    headers: {
      "Accept-Language": "en",
    },
  });
};

export {
  getAllCampingSeasons,
  getCampingSeasonById,
  createCampingSeason,
  updateCampingSeason,
  deleteCampingSeason,
};
