import React from "react";
import {
  menuAdmin,
  menuAdminNew,
  menuFinance,
  //   menuItems,
  menuChief,
  menuSuperUser,
  menuTrainer,
  menuOpx,
} from "./data";

const Menu = (role = "") => {
  let menuItems = [];
  switch (role) {
    case "Admin":
      menuItems = [...menuAdminNew];
      break;
    case "Finance":
      menuItems = [...menuFinance];
      break;
    case "Coach":
      menuItems = [...menuTrainer];
      break;
    case "Opx":
      menuItems = [...menuOpx];
      break;
    case "Chief":
      menuItems = [...menuChief];
      break;
    default:
      menuItems = [
        ...menuChief,
        ...menuSuperUser,
        ...menuOpx,
        ...menuAdminNew,
        ...menuFinance,
        // ...menuTrainer,
      ];
      break;
  }

  localStorage.setItem("menuItems", JSON.stringify(menuItems));

  return menuItems;
};

export default Menu;
