import React, { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";

const LoginAdmin = lazy(() => import("@/pages/auth/login"));
const RegisterAdmin = lazy(() => import("@/pages/auth/register"));
const ForgotPassAdmin = lazy(() => import("@/pages/auth/forgot-password"));

const CEODashboard = lazy(() => import("@/pages/newDashboard/ceo"));
const CFODashboard = lazy(() => import("@/pages/newDashboard/cfo"));
const ExpensePage = lazy(() => import("@/pages/finance/expense"));
const ExpenseAddPage = lazy(() => import("@/pages/finance/expense/add"));
const ExpenseEditPage = lazy(() => import("@/pages/finance/expense/edit"));
const NotificationPage = lazy(() => import("@/pages/utility/notifications"));
const ErrorPage = lazy(() => import("@/pages/404"));

const ChiefRoutes = () => {
  return (
    <Routes>
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

      <Route
        path="/"
        element={
          <AuthenticatedRoute>
            <Layout />
          </AuthenticatedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard">
        <Route index element={<CEODashboard />} />
        <Route path="cfo" element={<CFODashboard />} />
        </Route>
        <Route path="finance/expense" element={<ExpensePage />} />
        <Route path="finance/expense/add" element={<ExpenseAddPage />} />
        <Route path="finance/expense/edit" element={<ExpenseEditPage />} />
        <Route index path="notifications" element={<NotificationPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
};

export default ChiefRoutes;
