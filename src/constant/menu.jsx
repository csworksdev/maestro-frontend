import {
  menuAdminNew,
  menuFinance,
  menuChief,
  menuSuperUser,
  menuTrainer,
  menuOpx,
  menuHydro,
} from "./data";

const getMenuByRole = (role = "") => {
  switch (role) {
    case "Admin":
      return [...menuAdminNew];
    case "Finance":
      return [...menuFinance];
    case "Coach":
    case "Trainer":
      return [...menuTrainer];
    case "Opx":
      return [...menuOpx];
    case "Chief":
      return [...menuChief];
    case "Hydro":
      return [...menuHydro];
    default:
      return [
        ...menuChief,
        ...menuSuperUser,
        ...menuOpx,
        ...menuAdminNew,
        ...menuFinance,
        ...menuHydro,
      ];
  }
};

const Menu = (role = "") => {
  if (Array.isArray(role)) {
    return role.flatMap((item) => getMenuByRole(item));
  }

  return getMenuByRole(role);
};

export default Menu;
