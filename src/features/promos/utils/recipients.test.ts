import { describe, expect, it } from "vitest";
import { parseRecipients } from "./recipients";

describe("parseRecipients", () => {
  it("splits ids and phones on spaces, commas and new lines", () => {
    const r = parseRecipients("#12, 34\n0791234567 +962791234568، 12");
    expect(r.userIds).toEqual([12, 34]);
    expect(r.phones).toEqual(["0791234567", "+962791234568"]);
  });

  it("ignores empty and junk tokens", () => {
    expect(parseRecipients("  ,, abc ")).toEqual({ userIds: [], phones: [] });
  });
});
