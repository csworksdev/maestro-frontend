import React from "react";
import { useSelector } from "react-redux";
import DashboardPerpanjangTrainer from "./dashboardTrainer";
import DashboardPerpanjangOpx from "./dashboardOpx";
import DashboardPerpanjangAdmin from "./dashboardAdmin";

const FolloupPerpanjang = () => {
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);

  const dashboard = {
    Coach: <DashboardPerpanjangTrainer />,
    Opx: <DashboardPerpanjangOpx />,
    Superuser: <DashboardPerpanjangAdmin />,
    Admin: <DashboardPerpanjangAdmin />,
  };
  return dashboard[roles];
};

export default FolloupPerpanjang;
