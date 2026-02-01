import { server } from "../../../lib/@axios";
import type {
  SystemVersionDto,
  AddSystemVersionRequest,
  UpdateSystemVersionRequest,
  CheckSystemVersionRequest,
} from "../types/api";

/**
 * GET api/systemversion/GetAllSystemVersions
 * Returns list of version entries (platform, version, updateForce).
 */
const getVersions = async (
  signal?: AbortSignal
): Promise<SystemVersionDto[]> => {
  const { data } = await server.get<SystemVersionDto[]>(
    "api/systemversion/GetAllSystemVersions",
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/systemversion/AddSystemVersion
 * Body: platform, version, forceUpdate (boolean). Key is forceUpdate.
 */
const addVersion = async (
  body: AddSystemVersionRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.post(
    "api/systemversion/AddSystemVersion",
    body,
    { signal }
  );
};

/**
 * PUT api/systemversion/UpdateSystemVersion
 * Body: id, platform, version, updateForce (boolean). Key is updateForce.
 */
const updateVersion = async (
  body: UpdateSystemVersionRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(
    "api/systemversion/UpdateSystemVersion",
    body,
    { signal }
  );
};

/**
 * POST api/systemversion/CheckSystemVersion
 * Body: platform, version. Used by clients to check if an update is required.
 */
const checkSystemVersion = async (
  body: CheckSystemVersionRequest,
  signal?: AbortSignal
): Promise<unknown> => {
  const { data } = await server.post<unknown>(
    "api/systemversion/CheckSystemVersion",
    body,
    { signal }
  );
  return data;
};

export { getVersions, addVersion, updateVersion, checkSystemVersion };
