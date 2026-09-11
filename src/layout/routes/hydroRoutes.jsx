import React, { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";
import RoleMenuRouteFallback from "../RoleMenuRouteFallback";

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
const RoleMenuBuilder = lazy(() => import("@/pages/usermanagement/role-menu"));
const RoleUser = lazy(() => import("@/pages/usermanagement/role"));
const EditRoleUser = lazy(() => import("@/pages/usermanagement/role/edit"));
const PermissionBuilder = lazy(() => import("@/pages/usermanagement/permission"));
const Department = lazy(() => import("@/pages/usermanagement/department"));
const EditDepartment = lazy(() => import("@/pages/usermanagement/department/edit"));
const Loker = lazy(() => import("@/pages/usermanagement/loker"));
const EditLoker = lazy(() => import("@/pages/usermanagement/loker/edit"));
const Rekruitmen = lazy(() => import("@/pages/usermanagement/rekruitmen"));
const RekruitmenDetail = lazy(
  () => import("@/pages/usermanagement/rekruitmen/detail"),
);
const RecruitmentStagePage = lazy(
  () => import("@/pages/usermanagement/rekruitmen/stage"),
);
import { RECRUITMENT_STAGE_DEFINITIONS } from "@/pages/usermanagement/rekruitmen/stageConfig";

const recruitmentStageRouteAliases = RECRUITMENT_STAGE_DEFINITIONS.flatMap(
  (stage) => [
    { path: stage.route, element: <RecruitmentStagePage stageKey={stage.key} /> },
    {
      path: `tahapan/${stage.route}`,
      element: <RecruitmentStagePage stageKey={stage.key} />,
    },
  ],
);

const routeAliases = [
  { path: "dashboard", element: <DashboardOperational /> },
  { path: "dashboard/chart", element: <HydroDashboardChart /> },
  { path: "dashboard/operasional/okupansi", element: <DashboardOkupansi /> },
  {
    path: "dashboard/operasional/okupansi/branch",
    element: <OkupansiBranch />,
  },
  {
    path: "dashboard/operasional/okupansi/branch/pool",
    element: <OkupansiPool />,
  },
  { path: "chart", element: <HydroDashboardChart /> },
  { path: "daily", element: <DashboardDaily /> },
  { path: "spesialisasi", element: <Specialization /> },
  { path: "spesialisasi/add", element: <EditSpecialization /> },
  { path: "spesialisasi/Edit", element: <EditSpecialization /> },
  { path: "trainer", element: <Trainer /> },
  { path: "trainer/add", element: <EditTrainer /> },
  { path: "trainer/Edit", element: <EditTrainer /> },
  { path: "notifications", element: <NotificationPage /> },
  { path: "role-menu", element: <RoleMenuBuilder /> },
  { path: "role-user", element: <RoleUser /> },
  { path: "role-user/add", element: <EditRoleUser /> },
  { path: "role-user/Edit", element: <EditRoleUser /> },
  { path: "permissions", element: <PermissionBuilder /> },
  { path: "departments", element: <Department /> },
  { path: "departments/add", element: <EditDepartment /> },
  { path: "departments/Edit", element: <EditDepartment /> },
  { path: "loker", element: <Loker /> },
  { path: "loker/add", element: <EditLoker /> },
  { path: "loker/Edit", element: <EditLoker /> },
  { path: "jobs", element: <Loker /> },
  { path: "jobs/add", element: <EditLoker /> },
  { path: "jobs/Edit", element: <EditLoker /> },
  { path: "rekruitmen", element: <Rekruitmen /> },
  { path: "rekruitmen/detail/:applicationId", element: <RekruitmenDetail /> },
  { path: "applications", element: <Rekruitmen /> },
  { path: "applications/detail/:applicationId", element: <RekruitmenDetail /> },
  ...recruitmentStageRouteAliases,
];

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
        <Route path="role-menu" element={<RoleMenuBuilder />} />
        <Route path="role-user">
          <Route index element={<RoleUser />} />
          <Route path="add" element={<EditRoleUser />} />
          <Route path="Edit" element={<EditRoleUser />} />
        </Route>
        <Route path="permissions" element={<PermissionBuilder />} />
        <Route path="departments">
          <Route index element={<Department />} />
          <Route path="add" element={<EditDepartment />} />
          <Route path="Edit" element={<EditDepartment />} />
        </Route>
        <Route path="loker">
          <Route index element={<Loker />} />
          <Route path="add" element={<EditLoker />} />
          <Route path="Edit" element={<EditLoker />} />
        </Route>
        <Route path="rekruitmen">
          <Route index element={<Rekruitmen />} />
          <Route path="detail/:applicationId" element={<RekruitmenDetail />} />
        </Route>
        {RECRUITMENT_STAGE_DEFINITIONS.map((stage) => (
          <Route
            key={stage.key}
            path={stage.route}
            element={<RecruitmentStagePage stageKey={stage.key} />}
          />
        ))}
        <Route path="tahapan">
          {RECRUITMENT_STAGE_DEFINITIONS.map((stage) => (
            <Route
              key={stage.key}
              path={stage.route}
              element={<RecruitmentStagePage stageKey={stage.key} />}
            />
          ))}
        </Route>
        <Route
          path="*"
          element={
            <RoleMenuRouteFallback
              fallback={<ErrorPage />}
              routeAliases={routeAliases}
            />
          }
        />
      </Route>
    </Routes>
  );
};

export default HydroRoutes;
