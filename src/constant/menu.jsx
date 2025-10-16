import {
  menuAdminNew,
  menuFinance,
  menuChief,
  menuSuperUser,
  menuTrainer,
  menuOpx,
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
    default:
      return [
        ...menuChief,
        ...menuSuperUser,
        ...menuOpx,
        ...menuAdminNew,
        ...menuFinance,
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
