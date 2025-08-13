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
  const subdomain = hostname.split(".")[0];
  // const isAuth = useSelector((state) => state.auth.isAuth);
  setupInterceptors();

  useEffect(() => {
    if (isChrome()) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          getToken(messaging, {
            vapidKey: import.meta.env.FCM_VAPID_KEY,
          })
            .then((currentToken) => {
              if (!currentToken) {
                console.log("No registration token available.");
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
  }, []);

  useEffect(() => {
    if (isChrome()) {
      const unsubscribe = onMessage(messaging, (payload) => {
        toast.info(
          `${payload.notification.title} - ${payload.notification.body}`
        );
      });

      return () => unsubscribe();
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
          {subdomain === "admin" && (
            <Route path="*" element={<AdminRoutes />} />
          )}
          {subdomain === "coach" && (
            <Route path="*" element={<CoachRoutes />} />
          )}
          {subdomain === "finance" && (
            <Route path="*" element={<FinanceRoutes />} />
          )}
          {subdomain === "opx" && <Route path="*" element={<OpxRoutes />} />}

          {/* Fallback */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;
