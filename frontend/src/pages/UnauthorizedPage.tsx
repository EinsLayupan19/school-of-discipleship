import { ShieldAlert } from "lucide-react";
import { ErrorPage } from "@/components/layout/ErrorPage";

export default function UnauthorizedPage() {
  return (
    <ErrorPage
      icon={ShieldAlert}
      code="403"
      title="Access denied"
      message="Your account role doesn't have permission to view this page."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
