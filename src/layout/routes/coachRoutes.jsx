import React, { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";
import { Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Redir from "@/pages/redir";

const LoginTrainer = lazy(() => import("@/pages/auth/login2"));
const RegisterTrainer = lazy(() => import("@/pages/auth/register2"));
const ForgotPassTrainer = lazy(() => import("@/pages/auth/forgot-password2"));

const CoachDashboard = lazy(() => import("@/pages/trainer/dashboard"));
const CoachEarning = lazy(() => import("@/pages/trainer/earning"));
const CoachPerformance = lazy(() => import("@/pages/trainer/performance"));
const CoachSchedule = lazy(() => import("@/pages/trainer/schedule"));
const CoachPresence = lazy(() => import("@/pages/trainer/presence"));
const CoachPresence2 = lazy(() => import("@/pages/trainer/presencecopy"));
const TrainerCourseReminder = lazy(() => import("@/pages/trainer/reminder"));
const Leave = lazy(() => import("@/pages/trainer/leaves/leave"));
const LeaveForm = lazy(() => import("@/pages/trainer/leaves/leaveForm"));

const ErrorPage = lazy(() => import("@/pages/404"));
const FolloupPerpanjang = lazy(() => import("@/pages/perpanjangpaket/index"));
const NotificationPage = lazy(() => import("@/pages/utility/notifications"));
const OwnSchedule = lazy(() => import("@/pages/trainer/ownSchedule"));

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
      <Route path="/*" element={<Redir />}>
        {/* <Route
        path="/*"
        element={
          <AuthenticatedRoute>
            {/* <Layout /> */}
        {/* <Redir />
          </AuthenticatedRoute>
        }
      > */}
        {/* <Route index element={<Navigate to="presence" replace />} /> */}
        {/* <Route path="dashboard" element={<CoachDashboard />} /> */}
        {/* <Route path="coach">
          <Route index element={<CoachDashboard />} /> */}
        {/* <Route path="earning" element={<CoachEarning />} />
        <Route path="jadwal" element={<OwnSchedule />} /> */}
        {/* <Route path="performance" element={<CoachPerformance />} />
          <Route path="schedule" element={<CoachSchedule />} /> */}
        {/* <Route path="presence" element={<CoachPresence2 />} /> */}
        {/* <Route path="presence2" element={<CoachPresence2 />} /> */}
        {/* <Route path="reminder" element={<TrainerCourseReminder />} /> */}
        {/* <Route path="izin">
          <Route index element={<Leave />} />
          <Route path="ajukan" element={<LeaveForm />} />
        </Route>
        <Route path="followup-perpanjang">
          <Route index element={<FolloupPerpanjang />} />
        </Route>
        <Route index path="notifications" element={<NotificationPage />} /> */}
        {/* </Route> */}
        {/* <Route path="*" element={<ErrorPage />} /> */}
      </Route>
    </Routes>
  );
};

export default CoachRoutes;
