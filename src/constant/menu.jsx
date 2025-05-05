import React from "react";
import {
  menuAdmin,
  menuAdminNew,
  menuFinance,
  //   menuItems,
  menuChief,
  menuSuperUser,
  menuTrainer,
  menuOps,
} from "./data";

const Menu = (role = "") => {
  let menuItems = [];
  switch (role) {
    case "Admin":
      menuItems = [...menuAdminNew, ...menuFinance];
      break;
    case "Finance":
      menuItems = [...menuFinance];
      break;
    case "Trainer":
      menuItems = [...menuTrainer];
      break;
    case "Ops":
      menuItems = [...menuOps];
      break;
    case "Chief":
      menuItems = [...menuChief];
      break;
    default:
      menuItems = [
        ...menuSuperUser,
        ...menuAdmin,
        ...menuChief,
        ...menuFinance,
        ...menuTrainer,
      ];
      break;
  }

  localStorage.setItem("menuItems", JSON.stringify(menuItems));
};

export default Menu;
