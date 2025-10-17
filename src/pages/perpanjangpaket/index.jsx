import React from "react";
import { useAuthStore } from "@/redux/slicers/authSlice";
import DashboardPerpanjangTrainer from "./dashboardTrainer";
import DashboardPerpanjangOpx from "./dashboardOpx";
import DashboardPerpanjangAdmin from "./dashboardAdmin";

const FolloupPerpanjang = () => {
  const { user_id, username, roles } = useAuthStore((state) => state.data);

  const dashboard = {
    Coach: <DashboardPerpanjangTrainer />,
    Opx: <DashboardPerpanjangOpx />,
    Superuser: <DashboardPerpanjangAdmin />,
    Admin: <DashboardPerpanjangAdmin />,
  };
  return dashboard[roles];
};

export default FolloupPerpanjang;
