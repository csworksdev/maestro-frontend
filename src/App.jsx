import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import AuthLayout from "./layout/AuthLayout";
import Loading from "@/components/Loading";
import PublicRoute from "./layout/PublicRoute";

import AdminRoutes from "./layout/routes/adminRoutes";
import ChiefRoutes from "./layout/routes/chiefRoutes";
import FinanceRoutes from "./layout/routes/financeRoutes";
import OpxRoutes from "./layout/routes/operationalRoutes";
import HydroRoutes from "./layout/routes/hydroRoutes";
import { useFcmToken } from "./hooks/useFCMToken";
import Redir from "./pages/redir";
import { useSubdomainStore } from "./redux/slicers/subdomainSlice";

const LoginAdmin = lazy(() => import("@/pages/auth/login"));
const LoginCoach = lazy(() => import("@/pages/auth/login2"));
const RegisterAdmin = lazy(() => import("@/pages/auth/register"));
const ForgotPassAdmin = lazy(() => import("@/pages/auth/forgot-password"));

// Lazy-only if used here
const ErrorPage = lazy(() => import("./pages/404"));

const App = () => {
  const subdomain = useSubdomainStore((state) => state.subdomain);
  // const isAuth = useSelector((state) => state.auth.isAuth);

  const { fcmToken, removeFcmToken } = useFcmToken();

  useEffect(() => {
    if (fcmToken) {
      // console.log("🎯 FCM Token siap dipakai:", fcmToken);
      // misalnya init WebSocket di sini
    }
  }, [fcmToken]);

  const routesMap = {
    admin: <AdminRoutes />,
    chief: <ChiefRoutes />,
    finance: <FinanceRoutes />,
    opx: <OpxRoutes />,
    hydro: <HydroRoutes />,
  };

  if (subdomain === "coach") {
    return (
      <main className="App relative">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="*" element={<Redir />} />
          </Routes>
        </Suspense>
      </main>
    );
  }

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
