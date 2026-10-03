import { server } from "../../../lib/@axios";
import type { BoostDto, BoostPayload, WelcomeBonusDto } from "../types/boosts";

// ── Welcome bonus (first-charge double points) ───────────────────────
/**
 * GET api/settings/welcome-bonus → { multiplier, isEnabled, isDefault }.
 * multiplier 1 = disabled; server default is 2 (double). Admin only.
 */
export const getWelcomeBonus = async (signal?: AbortSignal): Promise<WelcomeBonusDto> => {
  const { data } = await server.get<WelcomeBonusDto>("api/settings/welcome-bonus", { signal });
  const multiplier = typeof data?.multiplier === "number" ? data.multiplier : 2;
  return {
    multiplier,
    isEnabled: data?.isEnabled ?? multiplier > 1,
    isDefault: data?.isDefault,
  };
};

/**
 * PUT api/settings/welcome-bonus { multiplier } (admin only).
 * Valid range 1–10; 1 disables the bonus. Server rejects <1 or >10 with 400.
 */
export const setWelcomeBonus = async (multiplier: number, signal?: AbortSignal): Promise<void> => {
  await server.put("api/settings/welcome-bonus", { multiplier }, { signal });
};

// ── Loyalty boost campaigns ──────────────────────────────────────────
/**
 * GET api/loyalty/boosts?activeOnly=&currentOnly= (admin).
 * The params are documented as optional, but the dev endpoint 400s when they're
 * omitted entirely — so we always send explicit booleans. Admin list shows all
 * boosts (including ended/deactivated), hence both default to false.
 */
export const getBoosts = async (
  filters?: { activeOnly?: boolean; currentOnly?: boolean },
  signal?: AbortSignal
): Promise<BoostDto[]> => {
  const { data } = await server.get<BoostDto[]>("api/loyalty/boosts", {
    params: {
      activeOnly: filters?.activeOnly ?? false,
      currentOnly: filters?.currentOnly ?? false,
    },
    signal,
  });
  return Array.isArray(data) ? data : [];
};

export const createBoost = async (body: BoostPayload, signal?: AbortSignal): Promise<void> => {
  await server.post("api/loyalty/boosts", body, { signal });
};

export const updateBoost = async (
  id: number,
  body: BoostPayload,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(`api/loyalty/boosts/${id}`, body, { signal });
};

/** PUT api/loyalty/boosts/{id}/deactivate — the only mutation allowed on a running boost. */
export const deactivateBoost = async (id: number, signal?: AbortSignal): Promise<void> => {
  await server.put(`api/loyalty/boosts/${id}/deactivate`, undefined, { signal });
};
