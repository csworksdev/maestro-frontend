import React, { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";
import RoleMenuRouteFallback from "../RoleMenuRouteFallback";

// Auth Pages

// Dashboard
const DashboardOkupansi = lazy(() =>
  import("@/pages/newDashboard/operasional/okupansi")
);
const OkupansiBranch = lazy(() =>
  import("@/pages/newDashboard/operasional/okupansi/okupansi_branch")
);
const OkupansiPool = lazy(() =>
  import("@/pages/newDashboard/operasional/okupansi/okupansi_pool")
);

// Referensi
const Cabang = lazy(() => import("@/pages/referensi/cabang"));
const AddCabang = lazy(() => import("@/pages/referensi/cabang/edit"));
const EditCabang = lazy(() => import("@/pages/referensi/cabang/edit"));
const Kolam = lazy(() => import("@/pages/referensi/kolam"));
const EditKolam = lazy(() => import("@/pages/referensi/kolam/edit"));
const Specialization = lazy(() => import("@/pages/referensi/spesialisasi"));
const EditSpecialization = lazy(() =>
  import("@/pages/referensi/spesialisasi/edit")
);

// Master Data
const Trainer = lazy(() => import("@/pages/masterdata/trainer"));
const EditTrainer = lazy(() => import("@/pages/masterdata/trainer/edit"));

// Order
const Order = lazy(() => import("@/pages/order/active"));
const DetailOrder = lazy(() => import("@/pages/order/active/detail"));
const CekJadwal = lazy(() => import("@/pages/order/cekJadwal/cekJadwal"));

// Pelatihan

// User Management
const UMUser = lazy(() => import("@/pages/usermanagement/user"));
const UMUserEdit = lazy(() => import("@/pages/usermanagement/user/edit"));
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

// Finance
const RekapBulanan = lazy(() =>
  import("@/pages/finance/rekapBulanan/rekapBulanan")
);

// Xendit

// Wati

// Fallback
const ErrorPage = lazy(() => import("@/pages/404"));

const DashboardOperational = lazy(() =>
  import("@/pages/newDashboard/operasional/operational")
);
const DashboardDaily = lazy(() =>
  import("@/pages/newDashboard/operasional/daily/index.jsx")
);

import { Routes } from "react-router-dom";
import { RECRUITMENT_STAGE_DEFINITIONS } from "@/pages/usermanagement/rekruitmen/stageConfig";
const Leave = lazy(() => import("@/pages/izin/admin/leave"));
const FolloupPerpanjang = lazy(() => import("@/pages/perpanjangpaket/index"));
const NotificationPage = lazy(() => import("@/pages/utility/notifications"));
const Reschedule = lazy(() => import("@/pages/reschedule/admin"));

const routeAliases = [
  { path: "dashboard", element: <DashboardOperational /> },
  { path: "dashboard/operasional/okupansi", element: <DashboardOkupansi /> },
  {
    path: "dashboard/operasional/okupansi/branch",
    element: <OkupansiBranch />,
  },
  {
    path: "dashboard/operasional/okupansi/branch/pool",
    element: <OkupansiPool />,
  },
  { path: "daily", element: <DashboardDaily /> },
  { path: "order", element: <Order /> },
  { path: "order/detail", element: <DetailOrder /> },
  { path: "cabang", element: <Cabang /> },
  { path: "cabang/add", element: <AddCabang /> },
  { path: "cabang/Edit", element: <EditCabang /> },
  { path: "list-izin", element: <Leave /> },
  { path: "reschedule", element: <Reschedule /> },
  { path: "kolam", element: <Kolam /> },
  { path: "kolam/add", element: <EditKolam /> },
  { path: "kolam/Edit", element: <EditKolam /> },
  { path: "spesialisasi", element: <Specialization /> },
  { path: "spesialisasi/add", element: <EditSpecialization /> },
  { path: "spesialisasi/Edit", element: <EditSpecialization /> },
  { path: "trainer", element: <Trainer /> },
  { path: "trainer/add", element: <EditTrainer /> },
  { path: "trainer/Edit", element: <EditTrainer /> },
  { path: "cek-jadwal", element: <CekJadwal /> },
  { path: "rekap-bulanan", element: <RekapBulanan /> },
  { path: "rekap-bulanan/detailorderpelatih", element: <DetailOrder /> },
  { path: "user", element: <UMUser /> },
  { path: "user/add", element: <UMUserEdit /> },
  { path: "user/Edit", element: <UMUserEdit /> },
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
  ...RECRUITMENT_STAGE_DEFINITIONS.flatMap((stage) => [
    { path: stage.route, element: <RecruitmentStagePage stageKey={stage.key} /> },
    {
      path: `tahapan/${stage.route}`,
      element: <RecruitmentStagePage stageKey={stage.key} />,
    },
  ]),
  { path: "followup-perpanjang", element: <FolloupPerpanjang /> },
  { path: "notifications", element: <NotificationPage /> },
];

const OpxRoutes = () => {
  return (
    <Routes>
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
        <Route path="daily" element={<DashboardDaily />} />
        <Route path="order">
          <Route index element={<Order />} />
          {/* <Route path="add" element={<AddOrder />} />
                          <Route path="Edit" element={<EditOrder />} /> */}
          <Route path="detail" element={<DetailOrder />} />
        </Route>
        <Route path="cabang">
          <Route index element={<Cabang />} />
          <Route path="add" element={<AddCabang />} />
          <Route path="Edit" element={<EditCabang />} />
        </Route>
        <Route path="list-izin">
          <Route index element={<Leave />} />
        </Route>
        <Route path="reschedule">
          <Route index element={<Reschedule />} />
        </Route>
        <Route path="kolam">
          <Route index element={<Kolam />} />
          <Route path="add" element={<EditKolam />} />
          <Route path="Edit" element={<EditKolam />} />
        </Route>
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
        <Route path="cek-jadwal">
          <Route index element={<CekJadwal />} />
        </Route>
        <Route path="rekap-bulanan">
          <Route index element={<RekapBulanan />} />
          <Route path="detailorderpelatih" element={<DetailOrder />} />
        </Route>
        <Route path="user">
          <Route index element={<UMUser />} />
          <Route path="add" element={<UMUserEdit />} />
          <Route path="Edit" element={<UMUserEdit />} />
        </Route>
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
        <Route path="followup-perpanjang">
          <Route index element={<FolloupPerpanjang />} />
        </Route>
        <Route index path="notifications" element={<NotificationPage />} />
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

export default OpxRoutes;
