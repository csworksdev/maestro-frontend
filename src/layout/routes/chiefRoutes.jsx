import React, { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "../Layout";
import AuthLayout from "../AuthLayout";
import PublicRoute from "../PublicRoute";
import AuthenticatedRoute from "../AuthenticatedRoute";
import RoleMenuRouteFallback from "../RoleMenuRouteFallback";

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
const RoleMenuBuilder = lazy(() => import("@/pages/usermanagement/role-menu"));
const RoleUser = lazy(() => import("@/pages/usermanagement/role"));
const EditRoleUser = lazy(() => import("@/pages/usermanagement/role/edit"));
const PermissionBuilder = lazy(() => import("@/pages/usermanagement/permission"));
const Department = lazy(() => import("@/pages/usermanagement/department"));
const EditDepartment = lazy(() => import("@/pages/usermanagement/department/edit"));
const Loker = lazy(() => import("@/pages/usermanagement/loker"));
const EditLoker = lazy(() => import("@/pages/usermanagement/loker/edit"));
const Rekruitmen = lazy(() => import("@/pages/usermanagement/rekruitmen"));
const RekruitmenDetail = lazy(
  () => import("@/pages/usermanagement/rekruitmen/detail"),
);
const RecruitmentStagePage = lazy(
  () => import("@/pages/usermanagement/rekruitmen/stage"),
);
import { RECRUITMENT_STAGE_DEFINITIONS } from "@/pages/usermanagement/rekruitmen/stageConfig";

const recruitmentStageRouteAliases = RECRUITMENT_STAGE_DEFINITIONS.flatMap(
  (stage) => [
    { path: stage.route, element: <RecruitmentStagePage stageKey={stage.key} /> },
    {
      path: `tahapan/${stage.route}`,
      element: <RecruitmentStagePage stageKey={stage.key} />,
    },
  ],
);

const routeAliases = [
  { path: "dashboard", element: <CEODashboard /> },
  { path: "dashboard/cfo", element: <CFODashboard /> },
  { path: "finance/expense", element: <ExpensePage /> },
  { path: "finance/expense/add", element: <ExpenseAddPage /> },
  { path: "finance/expense/edit", element: <ExpenseEditPage /> },
  { path: "notifications", element: <NotificationPage /> },
  { path: "role-menu", element: <RoleMenuBuilder /> },
  { path: "role-user", element: <RoleUser /> },
  { path: "role-user/add", element: <EditRoleUser /> },
  { path: "role-user/Edit", element: <EditRoleUser /> },
  { path: "permissions", element: <PermissionBuilder /> },
  { path: "departments", element: <Department /> },
  { path: "departments/add", element: <EditDepartment /> },
  { path: "departments/Edit", element: <EditDepartment /> },
  { path: "loker", element: <Loker /> },
  { path: "loker/add", element: <EditLoker /> },
  { path: "loker/Edit", element: <EditLoker /> },
  { path: "jobs", element: <Loker /> },
  { path: "jobs/add", element: <EditLoker /> },
  { path: "jobs/Edit", element: <EditLoker /> },
  { path: "rekruitmen", element: <Rekruitmen /> },
  { path: "rekruitmen/detail/:applicationId", element: <RekruitmenDetail /> },
  { path: "applications", element: <Rekruitmen /> },
  { path: "applications/detail/:applicationId", element: <RekruitmenDetail /> },
  ...recruitmentStageRouteAliases,
];

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
        <Route path="role-menu" element={<RoleMenuBuilder />} />
        <Route path="role-user">
          <Route index element={<RoleUser />} />
          <Route path="add" element={<EditRoleUser />} />
          <Route path="Edit" element={<EditRoleUser />} />
        </Route>
        <Route path="permissions" element={<PermissionBuilder />} />
        <Route path="departments">
          <Route index element={<Department />} />
          <Route path="add" element={<EditDepartment />} />
          <Route path="Edit" element={<EditDepartment />} />
        </Route>
        <Route path="loker">
          <Route index element={<Loker />} />
          <Route path="add" element={<EditLoker />} />
          <Route path="Edit" element={<EditLoker />} />
        </Route>
        <Route path="rekruitmen">
          <Route index element={<Rekruitmen />} />
          <Route path="detail/:applicationId" element={<RekruitmenDetail />} />
        </Route>
        {RECRUITMENT_STAGE_DEFINITIONS.map((stage) => (
          <Route
            key={stage.key}
            path={stage.route}
            element={<RecruitmentStagePage stageKey={stage.key} />}
          />
        ))}
        <Route path="tahapan">
          {RECRUITMENT_STAGE_DEFINITIONS.map((stage) => (
            <Route
              key={stage.key}
              path={stage.route}
              element={<RecruitmentStagePage stageKey={stage.key} />}
            />
          ))}
        </Route>
        <Route
          path="*"
          element={
            <RoleMenuRouteFallback
              fallback={<ErrorPage />}
              routeAliases={routeAliases}
            />
          }
        />
      </Route>
    </Routes>
  );
};

export default ChiefRoutes;
