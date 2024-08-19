import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";
import Loading from "@/components/Loading";
import AuthenticatedRoute from "./layout/AuthenticatedRoute";
import PublicRoute from "./layout/PublicRoute";

const Dashboard = lazy(() => import("./pages/dashboard"));
const Login = lazy(() => import("./pages/auth/login"));
const Login2 = lazy(() => import("./pages/auth/login2"));
const Login3 = lazy(() => import("./pages/auth/login3"));
const Register = lazy(() => import("./pages/auth/register"));
const Register2 = lazy(() => import("./pages/auth/register2"));
const Register3 = lazy(() => import("./pages/auth/register3"));
const ForgotPass = lazy(() => import("./pages/auth/forgot-password"));
const ForgotPass2 = lazy(() => import("./pages/auth/forgot-password2"));
const ForgotPass3 = lazy(() => import("./pages/auth/forgot-password3"));
const LockScreen = lazy(() => import("./pages/auth/lock-screen"));
const LockScreen2 = lazy(() => import("./pages/auth/lock-screen2"));
const LockScreen3 = lazy(() => import("./pages/auth/lock-screen3"));
const Error = lazy(() => import("./pages/404"));
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
const CoachDashboard = lazy(() => import("./pages/trainer/dashboard"));
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

function App() {
  return (
    <main className="App relative">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route path="login" element={<Login />} />
            <Route path="login2" element={<Login2 />} />
            <Route path="login3" element={<Login3 />} />
            <Route path="register" element={<Register />} />
            <Route path="register2" element={<Register2 />} />
            <Route path="register3" element={<Register3 />} />
            <Route path="forgot-password" element={<ForgotPass />} />
            <Route path="forgot-password2" element={<ForgotPass2 />} />
            <Route path="forgot-password3" element={<ForgotPass3 />} />
            <Route path="lock-screen" element={<LockScreen />} />
            <Route path="lock-screen2" element={<LockScreen2 />} />
            <Route path="lock-screen3" element={<LockScreen3 />} />
          </Route>

          {/* Authenticated Routes */}
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
            //#region Trainer
            <Route path="coach">
              <Route index element={<CoachDashboard />} />
              <Route path="earning" element={<CoachEarning />} />
              <Route path="performance" element={<CoachPerformance />} />
              <Route path="schedule" element={<CoachSchedule />} />
              <Route path="presence" element={<CoachPresence />} />
              <Route path="reminder" element={<TrainerCourseReminder />} />
            </Route>
            //#endregion
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
            <Route path="*" element={<Navigate to="/404" />} />
          </Route>

          {/* Catch-all Route */}
          <Route path="*" element={<Navigate to="/auth/login" />} />
        </Routes>
      </Suspense>
    </main>
  );
}

export default App;
