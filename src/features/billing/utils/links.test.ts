import { describe, expect, it } from "vitest";
import { legacyEntityTypeFor, providerProfilePath } from "./links";

describe("billing links", () => {
  it("picks the engine row of the provider type", () => {
    expect(legacyEntityTypeFor(["StationPremium", "ServiceProviderPremium"], "ServiceProvider")).toBe("ServiceProviderPremium");
    expect(legacyEntityTypeFor(["OcppConnect"], "ChargingPoint")).toBe("OcppConnect");
    expect(legacyEntityTypeFor(["OcppConnect"], "ServiceProvider")).toBeNull();
    expect(legacyEntityTypeFor([], "ChargingPoint")).toBeNull();
  });

  it("links to the right profile", () => {
    expect(providerProfilePath("ServiceProvider", 5)).toBe("/service-providers/5");
    expect(providerProfilePath("ChargingPoint", 5)).toBe("/charge-management/5");
  });
});
