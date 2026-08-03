import React, { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";

// Auth Pages
const LoginAdmin = lazy(() => import("@/pages/auth/login"));
const RegisterAdmin = lazy(() => import("@/pages/auth/register"));
const ForgotPassAdmin = lazy(() => import("@/pages/auth/forgot-password"));

// Dashboard
const DashboardSales = lazy(() => import("@/pages/newDashboard/sales"));

// Master Data
const Siswa = lazy(() => import("@/pages/masterdata/siswa"));
const EditSiswa = lazy(() => import("@/pages/masterdata/siswa/edit"));

// Order
const Order = lazy(() => import("@/pages/order/active"));
const OrderFinished = lazy(() => import("@/pages/order/finished"));
const OrderExpired = lazy(() => import("@/pages/order/expired"));
const Waitinglist = lazy(() => import("@/pages/order/waitinglist"));
const EditOrder = lazy(() => import("@/pages/order/active/edit"));
const DetailOrder = lazy(() => import("@/pages/order/active/detail"));
const CekJadwal = lazy(() => import("@/pages/order/cekJadwal/cekJadwal"));
const Broadcast = lazy(() => import("@/pages/broadcast"));

// Xendit
const XenditTransaction = lazy(() => import("@/pages/xendit/transaction"));
const XenditInvoiceHistory = lazy(
  () => import("@/pages/xendit/invoice-history"),
);
const XenditInvoiceHistoryPreview = lazy(
  () => import("@/pages/xendit/invoice-history-preview"),
);
const XenditBalance = lazy(() => import("@/pages/xendit/saldo"));

// Wati
const KontakWati = lazy(() => import("@/pages/wati/kontak"));

// Fallback
const ErrorPage = lazy(() => import("@/pages/404"));

import { Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import ChatTest from "@/pages/utility/chattest";
import ChatPage from "@/pages/app/chat";
import SalesDashboard from "@/pages/newDashboard/sales";
const Promo = lazy(() => import("@/pages/masterdata/promo"));
const Leave = lazy(() => import("@/pages/izin/admin/leave"));
const FolloupPerpanjang = lazy(() => import("@/pages/perpanjangpaket/index"));
const EditPromo = lazy(() => import("@/pages/masterdata/promo/edit"));
const NotificationPage = lazy(() => import("@/pages/utility/notifications"));
const RescheduleApprovedAdmin = lazy(
  () => import("@/pages/reschedule/admin/approved"),
);

const AdminRoutes = () => {
  return (
    <Routes>
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
        <Route path="dashboard">
          //#region Dashboar operasional
          {/* <Route element={<Dashboard />} /> */}
          <Route index element={<DashboardSales />} />
          //#endregion Finance
        </Route>
        //#region master data
        <Route path="siswa">
          <Route index element={<Siswa />} />
          <Route path="add" element={<EditSiswa />} />
          <Route path="Edit" element={<EditSiswa />} />
        </Route>
        <Route path="promo">
          <Route index element={<Promo />} />
          <Route path="add" element={<EditPromo />} />
          <Route path="Edit" element={<EditPromo />} />
        </Route>
        //#endregion
        {/*  */}
        //#region order
        <Route path="order">
          <Route index element={<Order />} />
          {/* <Route path="add" element={<AddOrder />} />
                  <Route path="Edit" element={<EditOrder />} /> */}
          <Route path="detail" element={<DetailOrder />} />

          <Route path="expired" element={<OrderExpired />} />
          <Route path="waitinglist" element={<Waitinglist />} />
        </Route>
        <Route path="cek-jadwal">
          <Route index element={<CekJadwal />} />
        </Route>
        <Route path="broadcast">
          <Route index element={<Broadcast />} />
        </Route>
        {/* <Route path="finishedOrder">
          <Route index element={<OrderFinished />} />
          <Route path="Edit" element={<EditOrder />} />
          <Route path="detail" element={<DetailOrder />} />
        </Route> */}
        //#endregion
        {/*  */}
        //#region Xendit
        <Route path="xendit">
          {/* <Route index element={<Produk />} /> */}
          <Route path="transaction" element={<XenditTransaction />} />
          <Route path="invoice-history" element={<XenditInvoiceHistory />} />
          <Route
            path="invoice-history/:invoice_id"
            element={<XenditInvoiceHistoryPreview />}
          />
          <Route path="balance" element={<XenditBalance />} />
        </Route>
        <Route path="list-izin">
          <Route index element={<Leave />} />
        </Route>
        <Route path="reschedule">
          <Route index element={<RescheduleApprovedAdmin />} />
        </Route>
        //#endregion
        {/* Followup Perpanjang */}
        {/* <Route path="followup-perpanjang">
          <Route index element={<FolloupPerpanjang />} />
        </Route> */}
        {/* Fallback */}
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
