import React, { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";
import { Routes } from "react-router-dom";

const LoginTrainer = lazy(() => import("@/pages/auth/login2"));
const RegisterTrainer = lazy(() => import("@/pages/auth/register2"));
const ForgotPassTrainer = lazy(() => import("@/pages/auth/forgot-password2"));

const CoachDashboard = lazy(() => import("@/pages/trainer/dashboard"));
const CoachEarning = lazy(() => import("@/pages/trainer/earning"));
const CoachPerformance = lazy(() => import("@/pages/trainer/performance"));
const CoachSchedule = lazy(() => import("@/pages/trainer/schedule"));
const CoachPresence = lazy(() => import("@/pages/trainer/presence"));
const TrainerCourseReminder = lazy(() => import("@/pages/trainer/reminder"));
const Leave = lazy(() => import("@/pages/trainer/leaves/leave"));
const LeaveForm = lazy(() => import("@/pages/trainer/leaves/leaveForm"));

const ErrorPage = lazy(() => import("@/pages/404"));

export const CoachRoutes = () => {
  return (
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
        <Route path="login" element={<LoginTrainer />} />
        <Route path="register" element={<RegisterTrainer />} />
        <Route path="forgot-password" element={<ForgotPassTrainer />} />
      </Route>

      {/* Authenticated Routes */}
      <Route
        path="/"
        element={
          <AuthenticatedRoute>
            <Layout />
          </AuthenticatedRoute>
        }
      >
        {/* <Route path="dashboard" element={<CoachDashboard />} /> */}
        {/* <Route path="coach">
          <Route index element={<CoachDashboard />} /> */}
        <Route path="earning" element={<CoachEarning />} />
        {/* <Route path="performance" element={<CoachPerformance />} />
          <Route path="schedule" element={<CoachSchedule />} /> */}
        <Route path="presence" element={<CoachPresence />} />
        {/* <Route path="reminder" element={<TrainerCourseReminder />} /> */}
        <Route path="leaves">
          <Route index element={<Leave />} />
          <Route path="ajukan" element={<LeaveForm />} />
        </Route>
        {/* </Route> */}
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
};

export default CoachRoutes;
