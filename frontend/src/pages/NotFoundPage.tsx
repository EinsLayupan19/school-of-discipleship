import { SearchX } from "lucide-react";
import { ErrorPage } from "@/components/layout/ErrorPage";

export default function NotFoundPage() {
  return (
    <ErrorPage
      icon={SearchX}
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have been moved."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
