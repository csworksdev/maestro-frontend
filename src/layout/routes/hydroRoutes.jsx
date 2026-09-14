import React, { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";

// Auth Pages

// Dashboard
const HydroDashboardChart = lazy(() => import("@/pages/hydro/dashboardChart"));
const DashboardOkupansi = lazy(
  () => import("@/pages/newDashboard/operasional/okupansi"),
);
const OkupansiBranch = lazy(
  () => import("@/pages/newDashboard/operasional/okupansi/okupansi_branch"),
);
const OkupansiPool = lazy(
  () => import("@/pages/newDashboard/operasional/okupansi/okupansi_pool"),
);

const Specialization = lazy(() => import("@/pages/referensi/spesialisasi"));
const EditSpecialization = lazy(
  () => import("@/pages/referensi/spesialisasi/edit"),
);

// Master Data
const Trainer = lazy(() => import("@/pages/masterdata/trainer"));
const EditTrainer = lazy(() => import("@/pages/masterdata/trainer/edit"));

// Xendit

// Wati

// Fallback
const ErrorPage = lazy(() => import("@/pages/404"));

const DashboardOperational = lazy(
  () => import("@/pages/newDashboard/operasional/operational"),
);
const DashboardDaily = lazy(
  () => import("@/pages/newDashboard/operasional/daily/index.jsx"),
);

import { Routes } from "react-router-dom";
const NotificationPage = lazy(() => import("@/pages/utility/notifications"));

const HydroRoutes = () => {
  return (
    <Routes>
      {/* <Route path="/hydro/dashboard/chart/" element={<HydroDashboardChart />} /> */}
      {/* Public Routes for Admin */}
      {/* <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="login" element={<LoginAdmin />} />
        <Route path="register" element={<RegisterAdmin />} />
        <Route path="forgot-password" element={<ForgotPassAdmin />} />
      </Route> */}

      {/* Authenticated Routes for Admin */}
      <Route
        path="/"
        element={
          <AuthenticatedRoute>
            <Layout />
          </AuthenticatedRoute>
        }
      >
        <Route path="dashboard">
          <Route index element={<DashboardOperational />} />
          <Route path="chart" element={<HydroDashboardChart />} />

          <Route path="operasional">
            <Route path="okupansi">
              <Route index element={<DashboardOkupansi />} />
              <Route path="branch">
                <Route index element={<OkupansiBranch />} />
                <Route path="pool" element={<OkupansiPool />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="chart" element={<HydroDashboardChart />} />
        <Route path="daily" element={<DashboardDaily />} />
        <Route path="spesialisasi">
          <Route index element={<Specialization />} />
          <Route path="add" element={<EditSpecialization />} />
          <Route path="Edit" element={<EditSpecialization />} />
        </Route>
        <Route path="trainer">
          <Route index element={<Trainer />} />
          <Route path="add" element={<EditTrainer />} />
          <Route path="Edit" element={<EditTrainer />} />
        </Route>
        <Route index path="notifications" element={<NotificationPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
};

export default HydroRoutes;
