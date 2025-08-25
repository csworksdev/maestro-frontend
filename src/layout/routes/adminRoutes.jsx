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
const Dashboard = lazy(() => import("@/pages/dashboard"));
const DashboardRevenue = lazy(() => import("@/pages/newDashboard/revenue"));
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
const EditCabang = lazy(() => import("@/pages/referensi/cabang/edit"));
const Kolam = lazy(() => import("@/pages/referensi/kolam"));
const EditKolam = lazy(() => import("@/pages/referensi/kolam/edit"));
const Paket = lazy(() => import("@/pages/referensi/paket"));
const EditPaket = lazy(() => import("@/pages/referensi/paket/edit"));
const Periodisasi = lazy(() => import("@/pages/referensi/periodisasi"));
const EditPeriodisasi = lazy(() =>
  import("@/pages/referensi/periodisasi/edit")
);
const Specialization = lazy(() => import("@/pages/referensi/spesialisasi"));
const EditSpecialization = lazy(() =>
  import("@/pages/referensi/spesialisasi/edit")
);

// Master Data
const Siswa = lazy(() => import("@/pages/masterdata/siswa"));
const EditSiswa = lazy(() => import("@/pages/masterdata/siswa/edit"));
const Trainer = lazy(() => import("@/pages/masterdata/trainer"));
const EditTrainer = lazy(() => import("@/pages/masterdata/trainer/edit"));
const Produk = lazy(() => import("@/pages/masterdata/produk"));
const EditProduk = lazy(() => import("@/pages/masterdata/produk/edit"));

// Order
const Order = lazy(() => import("@/pages/order/active"));
const OrderFinished = lazy(() => import("@/pages/order/finished"));
const OrderExpired = lazy(() => import("@/pages/order/expired"));
const Waitinglist = lazy(() => import("@/pages/order/waitinglist"));
const EditOrder = lazy(() => import("@/pages/order/active/edit"));
const DetailOrder = lazy(() => import("@/pages/order/active/detail"));
const CekJadwal = lazy(() => import("@/pages/order/cekJadwal/cekJadwal"));
const Broadcast = lazy(() => import("@/pages/broadcast"));

// Pelatihan
const CoachDashboard = lazy(() => import("@/pages/trainer/dashboard"));
const CourseReminder = lazy(() => import("@/pages/pelatihan/reminder"));
const CourseSchedule = lazy(() => import("@/pages/trainer/schedule"));

// User Management
const UMUser = lazy(() => import("@/pages/usermanagement/user"));
const UMUserEdit = lazy(() => import("@/pages/usermanagement/user/edit"));
const UMMenu = lazy(() => import("@/pages/usermanagement/menu"));
const UMMenuEdit = lazy(() => import("@/pages/usermanagement/menu/edit"));
const UMRole = lazy(() => import("@/pages/usermanagement/role"));
const UMRoleEdit = lazy(() => import("@/pages/usermanagement/role/edit"));
const UMPermissions = lazy(() => import("@/pages/usermanagement/permission"));
const UMPermissionsEdit = lazy(() =>
  import("@/pages/usermanagement/permission/edit")
);

// Finance
const RekapBulanan = lazy(() =>
  import("@/pages/finance/rekapBulanan/rekapBulanan")
);

// Xendit
const XenditTransaction = lazy(() => import("@/pages/xendit/transaction"));
const XenditInvoiceHistory = lazy(() =>
  import("@/pages/xendit/invoice-history")
);
const XenditBalance = lazy(() => import("@/pages/xendit/saldo"));

// Wati
const KontakWati = lazy(() => import("@/pages/wati/kontak"));

// Fallback
const ErrorPage = lazy(() => import("@/pages/404"));

import { useSelector } from "react-redux";
import { Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Leave from "@/pages/izin/admin/leave";
import Promo from "@/pages/masterdata/promo";
import EditPromo from "@/pages/masterdata/promo/edit";

const AdminRoutes = () => {
  const roles = useSelector((state) => state.auth); // tetap bisa pakai hook di sini

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
          <Route element={<Dashboard />} />
          <Route path="operasional">
            <Route path="okupansi">
              <Route index element={<DashboardOkupansi />} />
              <Route path="branch">
                <Route index element={<OkupansiBranch />} />
                <Route path="pool" element={<OkupansiPool />} />
              </Route>
            </Route>
          </Route>
          //#endregion Finance
        </Route>
        //#region referensi
        <Route path="cabang">
          <Route index element={<Cabang />} />
          <Route path="add" element={<EditCabang />} />
          <Route path="edit" element={<EditCabang />} />
        </Route>
        <Route path="kolam">
          <Route index element={<Kolam />} />
          <Route path="add" element={<EditKolam />} />
          <Route path="edit" element={<EditKolam />} />
        </Route>
        <Route path="paket">
          <Route index element={<Paket />} />
          <Route path="add" element={<EditPaket />} />
          <Route path="edit" element={<EditPaket />} />
        </Route>
        <Route path="periodisasi">
          <Route index element={<Periodisasi />} />
          <Route path="add" element={<EditPeriodisasi />} />
          <Route path="edit" element={<EditPeriodisasi />} />
        </Route>
        <Route path="spesialisasi">
          <Route index element={<Specialization />} />
          <Route path="add" element={<EditSpecialization />} />
          <Route path="edit" element={<EditSpecialization />} />
        </Route>
        <Route path="kontakwati">
          <Route index element={<KontakWati />} />
          {/* <Route path="add" element={<EditSpecialization />} />
                  <Route path="edit" element={<EditSpecialization />} /> */}
        </Route>
        //#endregion
        {/*  */}
        //#region master data
        <Route path="siswa">
          <Route index element={<Siswa />} />
          <Route path="add" element={<EditSiswa />} />
          <Route path="edit" element={<EditSiswa />} />
        </Route>
        <Route path="trainer">
          <Route index element={<Trainer />} />
          <Route path="add" element={<EditTrainer />} />
          <Route path="edit" element={<EditTrainer />} />
        </Route>
        <Route path="produk">
          <Route index element={<Produk />} />
          <Route path="add" element={<EditProduk />} />
          <Route path="edit" element={<EditProduk />} />
        </Route>
        <Route path="promo">
          <Route index element={<Promo />} />
          <Route path="add" element={<EditPromo />} />
          <Route path="edit" element={<EditPromo />} />
        </Route>
        //#endregion
        {/*  */}
        //#region order
        <Route path="order">
          <Route index element={<Order />} />
          {/* <Route path="add" element={<AddOrder />} />
                  <Route path="edit" element={<EditOrder />} /> */}
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
          <Route path="edit" element={<EditOrder />} />
          <Route path="detail" element={<DetailOrder />} />
        </Route> */}
        //#endregion
        {/*  */}
        {/*  */}
        //#region Pelatihan
        <Route path="course">
          <Route index element={<CoachDashboard />} />
          {/* <Route path="earning" element={<CoachEarning />} />
              <Route path="performance" element={<CoachPerformance />} /> */}
          <Route path="reminder" element={<CourseReminder />} />
          <Route path="schedule" element={<CourseSchedule />} />
          {/* <Route path="presence" element={<CoachPresence />} />
              <Route path="reminder" element={<TrainerCourseReminder />} /> */}
        </Route>
        //#endregion
        {/*  */}
        //#region User Management
        <Route path="user">
          <Route index element={<UMUser />} />
          <Route path="add" element={<UMUserEdit />} />
          <Route path="edit" element={<UMUserEdit />} />
        </Route>
        <Route path="menu">
          <Route index element={<UMMenu />} />
          <Route path="add" element={<UMMenuEdit />} />
          <Route path="edit" element={<UMMenuEdit />} />
        </Route>
        <Route path="role">
          <Route index element={<UMRole />} />
          <Route path="add" element={<UMRoleEdit />} />
          <Route path="edit" element={<UMRoleEdit />} />
        </Route>
        <Route path="permissions">
          <Route index element={<UMPermissions />} />
          <Route path="add" element={<UMPermissionsEdit />} />
          <Route path="edit" element={<UMPermissionsEdit />} />
        </Route>
        //#endregion
        {/*  */}
        //#region Finance
        <Route path="rekap-bulanan">
          <Route index element={<RekapBulanan />} />
          <Route path="detailorderpelatih" element={<DetailOrder />} />
        </Route>
        //#endregion Finance
        {/*  */}
        {/*  */}
        //#region Xendit
        <Route path="xendit">
          {/* <Route index element={<Produk />} /> */}
          <Route path="transaction" element={<XenditTransaction />} />
          <Route path="invoice-history" element={<XenditInvoiceHistory />} />
          <Route path="balance" element={<XenditBalance />} />
        </Route>
        <Route path="list-izin">
          <Route index element={<Leave />} />
        </Route>
        //#endregion
        {/* Fallback */}
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
