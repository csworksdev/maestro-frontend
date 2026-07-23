const ROLE_DOMAIN_MAP = {
  admin: ["Admin", "Superuser"],
  finance: ["Finance"],
  chief: ["Chief"],
  opx: ["Opx"],
  hydro: ["Hydro", "Superuser"],
  coach: ["Coach", "Trainer"],
};

const normalizeRoleValue = (role) => {
  if (typeof role !== "string") return "";
  const normalized = role.trim();
  return normalized;
};

export const normalizeUserRoles = (roles, domain = "") => {
  const normalizedDomain = (domain || "").toLowerCase();
  const allowedRoles = ROLE_DOMAIN_MAP[normalizedDomain] || [];

  if (!Array.isArray(roles)) {
    const singleRole = normalizeRoleValue(roles);
    return allowedRoles.includes(singleRole) ? singleRole : "";
  }

  const normalizedRoles = roles.map(normalizeRoleValue).filter(Boolean);

  if (!normalizedRoles.length) return "";

  const matchingRoles = normalizedRoles.filter((role) =>
    allowedRoles.includes(role),
  );

  if (!matchingRoles.length) {
    return "";
  }

  if (normalizedDomain === "hydro") {
    if (matchingRoles.includes("Hydro")) {
      return "Hydro";
    }
    if (matchingRoles.includes("Superuser")) {
      return "Superuser";
    }
    return "";
  }

  return matchingRoles;
};
