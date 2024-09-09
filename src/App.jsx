import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";
import Loading from "@/components/Loading";
import AuthenticatedRoute from "./layout/AuthenticatedRoute";
import PublicRoute from "./layout/PublicRoute";

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
const NewProduk = lazy(() => import("./pages/masterdata/newproduk"));
const EditNewProduk = lazy(() => import("./pages/masterdata/newproduk/edit"));
const Order = lazy(() => import("./pages/order/active"));
const OrderFinished = lazy(() => import("./pages/order/finished"));
const OrderExpired = lazy(() => import("./pages/order/expired"));
const Waitinglist = lazy(() => import("./pages/order/waitinglist"));
const EditOrder = lazy(() => import("./pages/order/active/edit"));
const AddOrder = lazy(() => import("./pages/order/active/add"));
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

const App = () => {
  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0]; // Assumes subdomains are first (admin.domain.com or trainer.domain.com)

  console.log("Subdomain detected:", subdomain); // Debug subdomain

  return (
    <main className="App relative">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Admin Routes */}
          {(subdomain === "admin" || hostname === "maestro-front.web.app") && (
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
                <Route path="dashboard" element={<Dashboard />} />
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
                {/* <Route path="newproduk">
              <Route index element={<NewProduk />} />
              <Route path="add" element={<EditNewProduk />} />
              <Route path="edit" element={<EditNewProduk />} />
            </Route> */}
                //#endregion
                {/*  */}
                //#region order
                <Route path="order">
                  <Route index element={<Order />} />
                  <Route path="add" element={<AddOrder />} />
                  <Route path="edit" element={<EditOrder />} />
                  <Route
                    path="finished"
                    element={<OrderFinished is_finished={true} />}
                  />
                  <Route path="expired" element={<OrderExpired />} />
                  <Route path="waitinglist" element={<Waitinglist />} />
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
                <Route path="*" element={<ErrorPage />} />
              </Route>
            </>
          )}

          {/* Trainer Routes */}
          {subdomain === "trainer" && (
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
          <Route path="*" element={<Navigate to={`/auth/login`} />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;
