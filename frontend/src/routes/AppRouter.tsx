import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import { ProtectedRoute } from "./ProtectedRoute";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { RouteLoading } from "@/components/layout/RouteLoading";

// Everything past login is code-split — keeps the initial bundle small,
// since most users only ever touch a handful of these pages per session.
const DashboardPlaceholder = lazy(() => import("@/pages/DashboardPlaceholder"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const SecurityPage = lazy(() => import("@/pages/SecurityPage"));
const MdcPage = lazy(() => import("@/pages/MdcPage"));
const CcPage = lazy(() => import("@/pages/CcPage"));
const StudentProfilePage = lazy(() => import("@/pages/StudentProfilePage"));
const WeeksPage = lazy(() => import("@/pages/WeeksPage"));
const AttendancePage = lazy(() => import("@/pages/AttendancePage"));
const AttendanceSessionPage = lazy(() => import("@/pages/AttendanceSessionPage"));
const ActivitiesPage = lazy(() => import("@/pages/ActivitiesPage"));
const ActivityDetailPage = lazy(() => import("@/pages/ActivityDetailPage"));
const PAPage = lazy(() => import("@/pages/PAPage"));
const PADetailPage = lazy(() => import("@/pages/PADetailPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },

  {
    // All three roles may reach the Dashboard placeholder — it's what
    // every role lands on after login. Role-specific *content* within
    // it is a later-phase concern.
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MDC_FACILITATOR", "CC_FACILITATOR"]} />,
    children: [{ path: "/dashboard", element: withSuspense(<DashboardPlaceholder />) }],
  },

  {
    // User management and the audit trail are Super Admin only.
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />,
    children: [
      { path: "/users", element: withSuspense(<UsersPage />) },
      { path: "/audit-logs", element: withSuspense(<AuditLogsPage />) },
      { path: "/security", element: withSuspense(<SecurityPage />) },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MDC_FACILITATOR"]} />,
    children: [{ path: "/mdc", element: withSuspense(<MdcPage />) }],
  },
  {
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "CC_FACILITATOR"]} />,
    children: [{ path: "/cc", element: withSuspense(<CcPage />) }],
  },
  {
    // Individual student profile — accessible to any role that can reach
    // a student list at all; ownership is enforced server-side.
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MDC_FACILITATOR", "CC_FACILITATOR"]} />,
    children: [
      { path: "/students/:id", element: withSuspense(<StudentProfilePage />) },
      { path: "/weeks", element: withSuspense(<WeeksPage />) },
      { path: "/attendance", element: withSuspense(<AttendancePage />) },
      { path: "/attendance/:id", element: withSuspense(<AttendanceSessionPage />) },
      { path: "/activities", element: withSuspense(<ActivitiesPage />) },
      { path: "/activities/:id", element: withSuspense(<ActivityDetailPage />) },
      { path: "/pa", element: withSuspense(<PAPage />) },
      { path: "/pa/:id", element: withSuspense(<PADetailPage />) },
      { path: "/analytics", element: withSuspense(<AnalyticsPage />) },
      { path: "/reports", element: withSuspense(<ReportsPage />) },
    ],
  },

  // Root just forwards into the protected area; ProtectedRoute decides
  // from there whether that's /dashboard or a /login redirect.
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
