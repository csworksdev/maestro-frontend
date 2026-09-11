import { describe, expect, it } from "vitest";
import { normalizeUserRoles } from "./authRoles";

describe("normalizeUserRoles", () => {
  it("keeps only the hydro role for hydro domain when multiple roles are present", () => {
    expect(normalizeUserRoles(["Coach", "Hydro"], "hydro")).toBe("Hydro");
  });

  it("maps Superuser to the current domain menu role", () => {
    expect(normalizeUserRoles(["Coach", "Superuser"], "hydro")).toBe("Hydro");
  });

  it("maps Superuser to Opx menu in opx domain", () => {
    expect(normalizeUserRoles(["Superuser"], "opx")).toBe("Opx");
    expect(normalizeUserRoles(["Opx", "Superuser"], "opx")).toBe("Opx");
  });

  it("returns an empty value when no role matches the current domain", () => {
    expect(normalizeUserRoles(["Coach"], "hydro")).toBe("");
  });
});
