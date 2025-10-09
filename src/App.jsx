import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import AuthLayout from "./layout/AuthLayout";
import Loading from "@/components/Loading";
import PublicRoute from "./layout/PublicRoute";

import CoachRoutes from "./layout/routes/coachRoutes";
import AdminRoutes from "./layout/routes/adminRoutes";
import FinanceRoutes from "./layout/routes/financeRoutes";
import OpxRoutes from "./layout/routes/operationalRoutes";
import { useFcmToken } from "./hooks/useFCMToken";

const LoginAdmin = lazy(() => import("@/pages/auth/login"));
const LoginCoach = lazy(() => import("@/pages/auth/login2"));
const RegisterAdmin = lazy(() => import("@/pages/auth/register"));
const ForgotPassAdmin = lazy(() => import("@/pages/auth/forgot-password"));

// Lazy-only if used here
const ErrorPage = lazy(() => import("./pages/404"));

const App = () => {
  const hostname = window.location.hostname;
  let subdomain = hostname.split(".")[0];
  // const isAuth = useSelector((state) => state.auth.isAuth);

  const { fcmToken, removeFcmToken } = useFcmToken();

  useEffect(() => {
    if (fcmToken) {
      console.log("🎯 FCM Token siap dipakai:", fcmToken);
      // misalnya init WebSocket di sini
    }
  }, [fcmToken]);

  // hapus prefix "dev" kalau ada
  if (subdomain.startsWith("dev")) {
    subdomain = subdomain.replace("dev", "");
  }

  const routesMap = {
    admin: <AdminRoutes />,
    coach: <CoachRoutes />,
    finance: <FinanceRoutes />,
    opx: <OpxRoutes />,
  };

  return (
    <main className="App relative">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route
              path="login"
              element={subdomain === "coach" ? <LoginCoach /> : <LoginAdmin />}
            />
            <Route path="register" element={<RegisterAdmin />} />
            <Route path="forgot-password" element={<ForgotPassAdmin />} />
          </Route>

          {/* Domain routes */}
          <Route path="*" element={routesMap[subdomain] || <ErrorPage />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;
