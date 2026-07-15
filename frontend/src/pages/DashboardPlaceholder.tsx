import { useState } from "react";
import { Users, GraduationCap, CalendarCheck, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardCardsSkeleton } from "@/components/dashboard/DashboardCardsSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";

/**
 * Placeholder only — proves the layout (sidebar, top nav, cards, skeletons,
 * dark mode) all work together. No data fetching yet: stat values below are
 * static, and the "loading" toggle just demonstrates the skeleton UI exists.
 * Real dashboard data comes in a later phase.
 */
export default function DashboardPlaceholder() {
  const { profile } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Welcome, {profile?.fullName ?? "…"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Signed in as {profile?.role.replace("_", " ")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSkeleton((v) => !v)}>
            {showSkeleton ? "Show cards" : "Preview loading state"}
          </Button>
        </div>

        {showSkeleton ? (
          <DashboardCardsSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Students"
              value="—"
              icon={Users}
              description="Not wired up yet"
            />
            <StatCard
              label="Active Classes"
              value="—"
              icon={GraduationCap}
              description="Not wired up yet"
            />
            <StatCard
              label="Attendance Today"
              value="—"
              icon={CalendarCheck}
              description="Not wired up yet"
            />
            <StatCard
              label="Pending Unlocks"
              value="—"
              icon={AlertTriangle}
              description="Not wired up yet"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          This is a layout placeholder (Phase 4). Real dashboard data and per-role views come in a
          later phase.
        </p>
      </div>
    </AppShell>
  );
}
