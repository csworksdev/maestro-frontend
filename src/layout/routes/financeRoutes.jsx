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
const FinanceDashboard = lazy(() => import("@/pages/dashboard/finance"));

// Siswa
const Siswa = lazy(() => import("@/pages/masterdata/siswa"));
const EditSiswa = lazy(() => import("@/pages/masterdata/siswa/edit"));

// Xendit
const XenditTransaction = lazy(() => import("@/pages/xendit/transaction"));
const XenditInvoiceHistory = lazy(() =>
  import("@/pages/xendit/invoice-history")
);
const XenditBalance = lazy(() => import("@/pages/xendit/saldo"));

const NotificationPage = lazy(() => import("@/pages/utility/notifications"));

// Fallback
const ErrorPage = lazy(() => import("@/pages/404"));

import { Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Invoice from "@/pages/invoice";

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

        <Route path="xendit">
          <Route path="transaction" element={<XenditTransaction />} />
          <Route path="invoice-history" element={<XenditInvoiceHistory />} />
          <Route path="balance" element={<XenditBalance />} />
        </Route>
        <Route index path="notifications" element={<NotificationPage />} />
        {/* Fallback */}
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
};

export default FinanceRoutes;
