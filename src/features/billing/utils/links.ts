/** Path of a provider's profile in the admin. */
export const providerProfilePath = (providerType: string, providerId: number) =>
  providerType === "ServiceProvider" ? `/service-providers/${providerId}` : `/charge-management/${providerId}`;

const PROVIDER_OF_ENTITY: Record<string, string> = {
  StationPremium: "ChargingPoint",
  OcppConnect: "ChargingPoint",
  ServiceProviderPremium: "ServiceProvider",
};

/**
 * The existing-engine entity type a subscription plan pays for at this kind of
 * provider (same as the server's PlanCatalog.LegacyEntityTypeFor): the first of
 * the plan's legacyEntityTypes that belongs to the provider type.
 */
export function legacyEntityTypeFor(legacyEntityTypes: string[] | null | undefined, providerType: string): string | null {
  return (legacyEntityTypes ?? []).find((et) => PROVIDER_OF_ENTITY[et] === providerType) ?? null;
}
