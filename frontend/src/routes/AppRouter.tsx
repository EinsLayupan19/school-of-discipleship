import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import { ProtectedRoute } from "./ProtectedRoute";
import DashboardPlaceholder from "@/pages/DashboardPlaceholder";
import UsersPage from "@/pages/UsersPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import MdcPage from "@/pages/MdcPage";
import CcPage from "@/pages/CcPage";
import StudentProfilePage from "@/pages/StudentProfilePage";
import WeeksPage from "@/pages/WeeksPage";
import AttendancePage from "@/pages/AttendancePage";
import AttendanceSessionPage from "@/pages/AttendanceSessionPage";
import ActivitiesPage from "@/pages/ActivitiesPage";
import ActivityDetailPage from "@/pages/ActivityDetailPage";
import PAPage from "@/pages/PAPage";
import PADetailPage from "@/pages/PADetailPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import NotFoundPage from "@/pages/NotFoundPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },

  {
    // All three roles may reach the Dashboard placeholder — it's what
    // every role lands on after login. Role-specific *content* within
    // it is a later-phase concern.
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MDC_FACILITATOR", "CC_FACILITATOR"]} />,
    children: [{ path: "/dashboard", element: <DashboardPlaceholder /> }],
  },

  {
    // User management and the audit trail are Super Admin only.
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />,
    children: [
      { path: "/users", element: <UsersPage /> },
      { path: "/audit-logs", element: <AuditLogsPage /> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MDC_FACILITATOR"]} />,
    children: [{ path: "/mdc", element: <MdcPage /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "CC_FACILITATOR"]} />,
    children: [{ path: "/cc", element: <CcPage /> }],
  },
  {
    // Individual student profile — accessible to any role that can reach
    // a student list at all; ownership is enforced server-side.
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MDC_FACILITATOR", "CC_FACILITATOR"]} />,
    children: [
      { path: "/students/:id", element: <StudentProfilePage /> },
      { path: "/weeks", element: <WeeksPage /> },
      { path: "/attendance", element: <AttendancePage /> },
      { path: "/attendance/:id", element: <AttendanceSessionPage /> },
      { path: "/activities", element: <ActivitiesPage /> },
      { path: "/activities/:id", element: <ActivityDetailPage /> },
      { path: "/pa", element: <PAPage /> },
      { path: "/pa/:id", element: <PADetailPage /> },
      { path: "/analytics", element: <AnalyticsPage /> },
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
