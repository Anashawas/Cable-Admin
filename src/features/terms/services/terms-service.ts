import { server } from "../../../lib/@axios";
import type {
  TermsVersionSummaryDto,
  TermsVersionDetailDto,
  PublishTermsVersionRequest,
} from "../types/api";

/**
 * The backend is .NET and has returned both camelCase and PascalCase in the
 * past, and the acceptance-count field name is not pinned down in the spec.
 * Normalise defensively so a casing change upstream doesn't blank the column.
 */
function pick<T>(row: any, keys: string[], fallback: T): T {
  for (const k of keys) {
    if (row?.[k] !== undefined && row?.[k] !== null) return row[k] as T;
  }
  return fallback;
}

function normaliseSummary(row: any): TermsVersionSummaryDto {
  return {
    id: pick(row, ["id", "Id"], 0),
    systemVersion: pick(row, ["systemVersion", "SystemVersion"], ""),
    roleId: pick<number | null>(row, ["roleId", "RoleId"], null),
    effectiveFrom: pick<string | null>(
      row,
      ["effectiveFrom", "EffectiveFrom"],
      null
    ),
    isActive: pick(row, ["isActive", "IsActive"], false),
    acceptanceCount: pick(
      row,
      [
        "acceptanceCount",
        "AcceptanceCount",
        "acceptancesCount",
        "acceptedCount",
        "AcceptedCount",
        "totalAcceptances",
      ],
      0
    ),
    createdAt: pick<string | null>(row, ["createdAt", "CreatedAt"], null),
    createdBy: pick<string | null>(row, ["createdBy", "CreatedBy"], null),
  };
}

/**
 * GET api/terms/admin/GetAllTermsVersions
 * All versions with acceptance counts. Content is excluded by the backend.
 * Tolerates either a bare array or a paged envelope.
 */
const getAllTermsVersions = async (
  signal?: AbortSignal
): Promise<TermsVersionSummaryDto[]> => {
  const { data } = await server.get<unknown>(
    "api/terms/admin/GetAllTermsVersions",
    { signal }
  );
  const rows: any[] = Array.isArray(data)
    ? data
    : ((data as any)?.items ?? (data as any)?.data ?? (data as any)?.results ?? []);
  return rows.map(normaliseSummary);
};

/**
 * GET api/terms/admin/GetTermsVersionById/{id}
 * One version including the full Arabic + English bodies.
 */
const getTermsVersionById = async (
  id: number,
  signal?: AbortSignal
): Promise<TermsVersionDetailDto> => {
  const { data } = await server.get<any>(
    `api/terms/admin/GetTermsVersionById/${id}`,
    { signal }
  );
  return {
    ...normaliseSummary(data),
    contentEn: pick(data, ["contentEn", "ContentEn"], ""),
    contentAr: pick(data, ["contentAr", "ContentAr"], ""),
  };
};

/**
 * POST api/terms/admin/PublishTermsVersion
 * Deactivates the current version in the same role scope and activates this
 * one. Everyone in that scope is forced to re-accept.
 */
const publishTermsVersion = async (
  body: PublishTermsVersionRequest,
  signal?: AbortSignal
): Promise<void> => {
  await server.post("api/terms/admin/PublishTermsVersion", body, { signal });
};

export { getAllTermsVersions, getTermsVersionById, publishTermsVersion };
