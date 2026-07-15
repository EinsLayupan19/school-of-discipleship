import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  icon: LucideIcon;
  code?: string;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
}

export function ErrorPage({
  icon: Icon,
  code,
  title,
  message,
  actionLabel,
  actionHref,
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      {code && <p className="text-sm font-medium text-muted-foreground">{code}</p>}
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button asChild>
        <Link to={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
