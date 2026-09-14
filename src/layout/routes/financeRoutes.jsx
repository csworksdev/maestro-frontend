import React, { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";
import RoleMenuRouteFallback from "../RoleMenuRouteFallback";

// Auth Pages
const LoginAdmin = lazy(() => import("@/pages/auth/login"));
const RegisterAdmin = lazy(() => import("@/pages/auth/register"));
const ForgotPassAdmin = lazy(() => import("@/pages/auth/forgot-password"));

const Paket = lazy(() => import("@/pages/referensi/paket"));
const EditPaket = lazy(() => import("@/pages/referensi/paket/edit"));
const Periodisasi = lazy(() => import("@/pages/referensi/periodisasi"));
const EditPeriodisasi = lazy(() =>
  import("@/pages/referensi/periodisasi/edit")
);
const Produk = lazy(() => import("@/pages/masterdata/produk"));
const EditProduk = lazy(() => import("@/pages/masterdata/produk/edit"));

// Order
const Order = lazy(() => import("@/pages/order/active"));
const OrderFinished = lazy(() => import("@/pages/order/finished"));
const OrderExpired = lazy(() => import("@/pages/order/expired"));
const Waitinglist = lazy(() => import("@/pages/order/waitinglist"));
const EditOrder = lazy(() => import("@/pages/order/active/edit"));
const DetailOrder = lazy(() => import("@/pages/order/active/detail"));
// Finance
const RekapBulanan = lazy(() =>
  import("@/pages/finance/rekapBulanan/rekapBulanan")
);
const RekapPelatih = lazy(() => import("@/pages/finance/rekapPelatih"));
const FinanceDashboard = lazy(() => import("@/pages/dashboard/finance"));

// Siswa
const Siswa = lazy(() => import("@/pages/masterdata/siswa"));
const EditSiswa = lazy(() => import("@/pages/masterdata/siswa/edit"));

// Xendit
const XenditTransaction = lazy(() => import("@/pages/xendit/transaction"));
const XenditInvoiceHistory = lazy(() =>
  import("@/pages/xendit/invoice-history")
);
const XenditInvoiceHistoryPreview = lazy(() =>
  import("@/pages/xendit/invoice-history-preview")
);
const XenditBalance = lazy(() => import("@/pages/xendit/saldo"));

const NotificationPage = lazy(() => import("@/pages/utility/notifications"));

// Fallback
const ErrorPage = lazy(() => import("@/pages/404"));

import { Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Invoice from "@/pages/invoice";
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
  { path: "paket", element: <Paket /> },
  { path: "paket/add", element: <EditPaket /> },
  { path: "paket/Edit", element: <EditPaket /> },
  { path: "periodisasi", element: <Periodisasi /> },
  { path: "periodisasi/add", element: <EditPeriodisasi /> },
  { path: "periodisasi/Edit", element: <EditPeriodisasi /> },
  { path: "produk", element: <Produk /> },
  { path: "produk/add", element: <EditProduk /> },
  { path: "produk/Edit", element: <EditProduk /> },
  { path: "invoices", element: <Invoice /> },
  { path: "dashboard", element: <FinanceDashboard /> },
  { path: "order", element: <Order /> },
  { path: "order/detail", element: <DetailOrder /> },
  { path: "order/expired", element: <OrderExpired /> },
  { path: "order/waitinglist", element: <Waitinglist /> },
  { path: "siswa", element: <Siswa /> },
  { path: "siswa/add", element: <EditSiswa /> },
  { path: "siswa/Edit", element: <EditSiswa /> },
  { path: "finishedOrder", element: <OrderFinished /> },
  { path: "finishedOrder/Edit", element: <EditOrder /> },
  { path: "finishedOrder/detail", element: <DetailOrder /> },
  { path: "rekap-bulanan", element: <RekapBulanan /> },
  { path: "rekap-bulanan/detailorderpelatih", element: <DetailOrder /> },
  { path: "rekap-pelatih", element: <RekapPelatih /> },
  { path: "xendit/transaction", element: <XenditTransaction /> },
  { path: "xendit/invoice-history", element: <XenditInvoiceHistory /> },
  {
    path: "xendit/invoice-history/:invoice_id",
    element: <XenditInvoiceHistoryPreview />,
  },
  { path: "xendit/balance", element: <XenditBalance /> },
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

const FinanceRoutes = () => {
  //   console.log(data.roles);
  return (
    <Routes>
      {/* Public Routes for Admin */}
      <Route
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
      </Route>

      {/* Authenticated Routes for Admin */}
      <Route
        path="/"
        element={
          <AuthenticatedRoute>
            <Layout />
          </AuthenticatedRoute>
        }
      >
        <Route index element={<Navigate to="order" replace />} />
        <Route path="paket">
          <Route index element={<Paket />} />
          <Route path="add" element={<EditPaket />} />
          <Route path="Edit" element={<EditPaket />} />
        </Route>
        <Route path="periodisasi">
          <Route index element={<Periodisasi />} />
          <Route path="add" element={<EditPeriodisasi />} />
          <Route path="Edit" element={<EditPeriodisasi />} />
        </Route>
        <Route path="produk">
          <Route index element={<Produk />} />
          <Route path="add" element={<EditProduk />} />
          <Route path="Edit" element={<EditProduk />} />
        </Route>
        <Route path="invoices">
          <Route index element={<Invoice />} />
        </Route>
        {/*  */}
        <Route path="dashboard">
          <Route index element={<FinanceDashboard />} />
        </Route>
        <Route path="order">
          <Route index element={<Order />} />
          {/* <Route path="add" element={<AddOrder />} />
                  <Route path="Edit" element={<EditOrder />} /> */}
          <Route path="detail" element={<DetailOrder />} />
          <Route path="expired" element={<OrderExpired />} />
          <Route path="waitinglist" element={<Waitinglist />} />
        </Route>
        <Route path="siswa">
          <Route index element={<Siswa />} />
          <Route path="add" element={<EditSiswa />} />
          <Route path="Edit" element={<EditSiswa />} />
        </Route>
        <Route path="finishedOrder">
          <Route index element={<OrderFinished />} />
          <Route path="Edit" element={<EditOrder />} />
          <Route path="detail" element={<DetailOrder />} />
        </Route>

        <Route path="rekap-bulanan">
          <Route index element={<RekapBulanan />} />
          <Route path="detailorderpelatih" element={<DetailOrder />} />
        </Route>

        <Route path="rekap-pelatih">
          <Route index element={<RekapPelatih />} />
        </Route>

        <Route path="xendit">
          <Route path="transaction" element={<XenditTransaction />} />
          <Route path="invoice-history" element={<XenditInvoiceHistory />} />
          <Route
            path="invoice-history/:invoice_id"
            element={<XenditInvoiceHistoryPreview />}
          />
          <Route path="balance" element={<XenditBalance />} />
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
        {/* Fallback */}
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

export default FinanceRoutes;
