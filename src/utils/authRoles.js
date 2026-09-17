const ROLE_DOMAIN_MAP = {
  admin: ["Admin", "Superuser"],
  finance: ["Finance", "Superuser"],
  chief: ["Chief", "Superuser"],
  opx: ["Opx", "Superuser"],
  hydro: ["Hydro", "Superuser"],
  coach: ["Coach", "Trainer", "Superuser"],
};

const SUPERUSER_DOMAIN_ROLE = {
  admin: "Admin",
  finance: "Finance",
  chief: "Chief",
  opx: "Opx",
  hydro: "Hydro",
  coach: "Coach",
};

const normalizeRoleValue = (role) => {
  if (role && typeof role === "object") {
    return (
      role.name ||
      role.role_name ||
      role.codename ||
      role.code ||
      role.label ||
      ""
    ).trim();
  }
  if (typeof role !== "string") return "";
  const normalized = role.trim();
  return normalized;
};

export const normalizeUserRoles = (roles, domain = "") => {
  const normalizedDomain = (domain || "").toLowerCase();
  const allowedRoles = ROLE_DOMAIN_MAP[normalizedDomain] || [];

  if (!Array.isArray(roles)) {
    const singleRole = normalizeRoleValue(roles);
    if (singleRole === "Superuser") {
      return SUPERUSER_DOMAIN_ROLE[normalizedDomain] || "";
    }
    return allowedRoles.includes(singleRole) ? singleRole : "";
  }

  const normalizedRoles = roles.map(normalizeRoleValue).filter(Boolean);

  if (!normalizedRoles.length) return "";

  if (normalizedRoles.includes("Superuser")) {
    return SUPERUSER_DOMAIN_ROLE[normalizedDomain] || "";
  }

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
