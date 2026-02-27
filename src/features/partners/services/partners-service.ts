import { server } from "@/lib/@axios";
import type {
  PartnerAgreementDto,
  CreatePartnerAgreementRequest,
  UpdatePartnerAgreementRequest,
} from "../types/api";

const BASE = "/api/partners/admin";

export async function getAllPartnerAgreements(params?: {
  isActive?: boolean;
}): Promise<PartnerAgreementDto[]> {
  const { data } = await server.get<PartnerAgreementDto[]>(`${BASE}/GetAllPartnerAgreements`, {
    params,
  });
  return Array.isArray(data) ? data : [];
}

export async function createPartnerAgreement(
  body: CreatePartnerAgreementRequest
): Promise<number> {
  const { data } = await server.post<number>(`${BASE}/CreatePartnerAgreement`, body);
  return data;
}

export async function updatePartnerAgreement(
  id: number,
  body: UpdatePartnerAgreementRequest
): Promise<void> {
  await server.put(`${BASE}/UpdatePartnerAgreement/${id}`, body);
}

export async function deactivatePartnerAgreement(id: number): Promise<void> {
  await server.put(`${BASE}/DeactivatePartnerAgreement/${id}`);
}
