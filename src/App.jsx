import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";
import Loading from "@/components/Loading";
import AuthenticatedRoute from "./layout/AuthenticatedRoute";
import PublicRoute from "./layout/PublicRoute";
import { useSelector } from "react-redux";
import RekapBulanan from "./pages/finance/rekapBulanan/rekapBulanan";
import XenditTransaction from "./pages/xendit/transaction";
import XenditInvoiceHistory from "./pages/xendit/invoice-history";
import XenditBalance from "./pages/xendit/saldo";
import { setupInterceptors } from "./axios/config";
import { toast } from "react-toastify";
import { messaging, getToken, onMessage } from "@/firebase/firebase";
import { removeFcmToken } from "@/utils/fcm";
import isChrome from "./utils/isChrome";

// Lazy loading for pages
const Dashboard = lazy(() => import("./pages/dashboard"));
const LoginAdmin = lazy(() => import("./pages/auth/login"));
const LoginTrainer = lazy(() => import("./pages/auth/login2"));
const RegisterAdmin = lazy(() => import("./pages/auth/register"));
const RegisterTrainer = lazy(() => import("./pages/auth/register2"));
const ForgotPassAdmin = lazy(() => import("./pages/auth/forgot-password"));
const ForgotPassTrainer = lazy(() => import("./pages/auth/forgot-password2"));
const ErrorPage = lazy(() => import("./pages/404"));
const CoachDashboard = lazy(() => import("./pages/trainer/dashboard"));

const ComingSoonPage = lazy(() => import("./pages/utility/coming-soon"));
const UnderConstructionPage = lazy(() =>
  import("./pages/utility/under-construction")
);
const Cabang = lazy(() => import("./pages/referensi/cabang"));
const EditCabang = lazy(() => import("./pages/referensi/cabang/edit"));
const Kolam = lazy(() => import("./pages/referensi/kolam"));
const EditKolam = lazy(() => import("./pages/referensi/kolam/edit"));
const Paket = lazy(() => import("./pages/referensi/paket"));
const EditPaket = lazy(() => import("./pages/referensi/paket/edit"));
const Periodisasi = lazy(() => import("./pages/referensi/periodisasi"));
const EditPeriodisasi = lazy(() =>
  import("./pages/referensi/periodisasi/edit")
);
const Specialization = lazy(() => import("./pages/referensi/spesialisasi"));
const EditSpecialization = lazy(() =>
  import("./pages/referensi/spesialisasi/edit")
);
const Siswa = lazy(() => import("./pages/masterdata/siswa"));
const EditSiswa = lazy(() => import("./pages/masterdata/siswa/edit"));
const Trainer = lazy(() => import("./pages/masterdata/trainer"));
const EditTrainer = lazy(() => import("./pages/masterdata/trainer/edit"));
const Produk = lazy(() => import("./pages/masterdata/produk"));
const EditProduk = lazy(() => import("./pages/masterdata/produk/edit"));
const Order = lazy(() => import("./pages/order/active"));
const OrderFinished = lazy(() => import("./pages/order/finished"));
const OrderExpired = lazy(() => import("./pages/order/expired"));
const Waitinglist = lazy(() => import("./pages/order/waitinglist"));
const EditOrder = lazy(() => import("./pages/order/active/edit"));
const AddOrder = lazy(() => import("./pages/order/active/add"));
const DetailOrder = lazy(() => import("./pages/order/active/detail"));
const CoachEarning = lazy(() => import("./pages/trainer/earning"));
const CoachPerformance = lazy(() => import("./pages/trainer/performance"));
const CoachSchedule = lazy(() => import("./pages/trainer/schedule"));
const CoachPresence = lazy(() => import("./pages/trainer/presence"));
const UMUser = lazy(() => import("./pages/usermanagement/user"));
const UMUserEdit = lazy(() => import("./pages/usermanagement/user/edit"));
const UMMenu = lazy(() => import("./pages/usermanagement/menu"));
const UMMenuEdit = lazy(() => import("./pages/usermanagement/menu/edit"));
const UMRole = lazy(() => import("./pages/usermanagement/role"));
const UMRoleEdit = lazy(() => import("./pages/usermanagement/role/edit"));
const UMPermissions = lazy(() => import("./pages/usermanagement/permission"));
const UMPermissionsEdit = lazy(() =>
  import("./pages/usermanagement/permission/edit")
);
const TrainerCourseReminder = lazy(() => import("./pages/trainer/reminder"));
const CourseReminder = lazy(() => import("./pages/pelatihan/reminder"));
const CourseSchedule = lazy(() => import("./pages/trainer/schedule"));
const CekJadwal = lazy(() => import("./pages/order/cekJadwal/cekJadwal"));
const Broadcast = lazy(() => import("./pages/broadcast/index"));

// Dashboard
const DashboardRevenue = lazy(() => import("./pages/newDashboard/revenue"));

// Dashboard Operasional
const DashboardOkupansi = lazy(() =>
  import("./pages/newDashboard/operasional")
);
const OkupansiBranch = lazy(() =>
  import("./pages/newDashboard/operasional/okupansi_branch")
);
const OkupansiPool = lazy(() =>
  import("./pages/newDashboard/operasional/okupansi_pool")
);

const App = () => {
  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0];
  const isAuth = useSelector((state) => state.auth.isAuth);
  const { roles } = useSelector((state) => state.auth.data);
  setupInterceptors();

  useEffect(() => {
    // Minta izin dan ambil token
    if (isChrome()) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          getToken(messaging, {
            vapidKey: import.meta.env.FCM_VAPID_KEY,
          })
            .then((currentToken) => {
              if (currentToken) {
                // console.log("FCM Token:", currentToken);
                // Kirim token ke backend, simpan ke DB, dsb.
              } else {
                console.log(
                  "No registration token available. Request permission to generate one."
                );
              }
            })
            .catch(async (err) => {
              if (err.response?.data?.detail === "Token not registered") {
                await removeFcmToken();
              }
              console.log("An error occurred while retrieving token. ", err);
            });
        }
      });
    }

    // // Handle pesan saat app aktif (foreground)
    // onMessage(messaging, (payload) => {
    //   console.log("Message received. ", payload);
    //   alert(`${payload.notification.title} - ${payload.notification.body}`);
    // });
  }, []);

  useEffect(() => {
    if (isChrome()) {
      const unsubscribe = onMessage(messaging, (payload) => {
        // console.log("Message received. ", payload);
        // alert(`${payload.notification.title} - ${payload.notification.body}`);
        toast.info(
          `${payload.notification.title} - ${payload.notification.body}`
        );
      });

      return () => unsubscribe(); // pastikan cleanup saat komponen unmount
    }
  }, []);

  useEffect(() => {
    if (isChrome()) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        const data = event.data;
        if (data?.title && data?.body) {
          toast.info(`${data.title}: ${data.body}`);
        }
      });
    }
  }, []);

  return (
    <main className="App relative">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Admin Routes */}
          {subdomain === "admin" && (
            <>
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
                path="/app"
                element={
                  <AuthenticatedRoute>
                    <Layout />
                  </AuthenticatedRoute>
                }
              >
                <Route path="dashboard">
                  //#region Dashboar operasional
                  <Route
                    index
                    element={
                      roles === "Admin" ? <Dashboard /> : <DashboardRevenue />
                    }
                  />
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
                <Route path="finishedOrder">
                  <Route index element={<OrderFinished />} />
                  <Route path="edit" element={<EditOrder />} />
                  <Route path="detail" element={<DetailOrder />} />
                </Route>
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
                  <Route
                    path="invoice-history"
                    element={<XenditInvoiceHistory />}
                  />
                  <Route path="balance" element={<XenditBalance />} />
                </Route>
                //#endregion
                <Route path="*" element={<ErrorPage />} />
              </Route>
            </>
          )}

          {/* Trainer Routes */}
          {subdomain === "coach" && (
            <>
              {/* Public Routes for Trainer */}
              <Route
                path="/auth"
                element={
                  <PublicRoute>
                    <AuthLayout />
                  </PublicRoute>
                }
              >
                <Route path="login" element={<LoginTrainer />} />
                <Route path="register" element={<RegisterTrainer />} />
                <Route path="forgot-password" element={<ForgotPassTrainer />} />
              </Route>

              {/* Authenticated Routes for Trainer */}
              <Route
                path="/app"
                element={
                  <AuthenticatedRoute>
                    <Layout />
                  </AuthenticatedRoute>
                }
              >
                <Route path="dashboard" element={<CoachDashboard />} />
                <Route path="coach">
                  <Route index element={<CoachDashboard />} />
                  <Route path="earning" element={<CoachEarning />} />
                  <Route path="performance" element={<CoachPerformance />} />
                  <Route path="schedule" element={<CoachSchedule />} />
                  <Route path="presence" element={<CoachPresence />} />
                  <Route path="reminder" element={<TrainerCourseReminder />} />
                </Route>
                <Route path="*" element={<ErrorPage />} />
              </Route>
            </>
          )}

          {/* Fallback for unknown routes */}
          {/* <Route path="*" element={<Navigate to="/auth/login" replace />} /> */}
          <Route
            path="*"
            element={
              isAuth ? (
                <Navigate to="/app/dashboard" replace />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;
