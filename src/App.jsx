import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";
import Loading from "@/components/Loading";
import AuthenticatedRoute from "./layout/AuthenticatedRoute";
import PublicRoute from "./layout/PublicRoute";

import { messaging, getToken, onMessage } from "@/firebase/firebase";
import { removeFcmToken } from "@/utils/fcm";
import isChrome from "./utils/isChrome";
import { setupInterceptors } from "./axios/config";

import CoachRoutes from "./layout/routes/coachRoutes";
import AdminRoutes from "./layout/routes/adminRoutes";
import FinanceRoutes from "./layout/routes/financeRoutes";
import OpxRoutes from "./layout/routes/operationalRoutes";

const LoginAdmin = lazy(() => import("@/pages/auth/login"));
const RegisterAdmin = lazy(() => import("@/pages/auth/register"));
const ForgotPassAdmin = lazy(() => import("@/pages/auth/forgot-password"));

// Lazy-only if used here
const ErrorPage = lazy(() => import("./pages/404"));

const App = () => {
  const hostname = window.location.hostname;
  let subdomain = hostname.split(".")[0];
  // const isAuth = useSelector((state) => state.auth.isAuth);
  setupInterceptors();

  useEffect(() => {
    if (!isChrome()) return;

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        getToken(messaging, { vapidKey: import.meta.env.VITE_FCM_VAPID_KEY })
          .then((token) => {
            if (!token) console.log("No registration token available.");
          })
          .catch(async (err) => {
            if (err.response?.data?.detail === "Token not registered") {
              await removeFcmToken();
            }
            console.error("Error retrieving token:", err);
          });
      }
    });

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title;
      const body = payload.notification?.body;

      if (title && body) {
        toast.info(`${title} - ${body}`);
      }
    });

    const swListener = (event) => {
      const { title, body } = event.data || {};
      if (title && body) {
        toast.info(`${title}: ${body}`);
      }
    };

    navigator.serviceWorker.addEventListener("message", swListener);

    return () => {
      unsubscribe();
      navigator.serviceWorker.removeEventListener("message", swListener);
    };
  }, []);

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
            <Route path="login" element={<LoginAdmin />} />
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
