import { describe, expect, it } from "vitest";
import { normalizeUserRoles } from "./authRoles";

describe("normalizeUserRoles", () => {
  it("keeps only the hydro role for hydro domain when multiple roles are present", () => {
    expect(normalizeUserRoles(["Coach", "Hydro"], "hydro")).toBe("Hydro");
  });

  it("keeps Superuser as a privileged role even when other domain roles are present", () => {
    expect(normalizeUserRoles(["Coach", "Superuser"], "hydro")).toBe(
      "Superuser",
    );
  });

  it("returns an empty value when no role matches the current domain", () => {
    expect(normalizeUserRoles(["Coach"], "hydro")).toBe("");
  });
});
