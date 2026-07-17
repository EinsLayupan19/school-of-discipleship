import { useState } from "react";
import { Users, GraduationCap, CalendarCheck, AlertTriangle, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardCardsSkeleton } from "@/components/dashboard/DashboardCardsSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/AuthContext";
import {
  useAnnouncementsQuery,
  useCreateAnnouncementMutation,
} from "@/features/announcements/hooks";

/**
 * Placeholder only — proves the layout (sidebar, top nav, cards, skeletons,
 * dark mode) all work together. No data fetching yet: stat values below are
 * static, and the "loading" toggle just demonstrates the skeleton UI exists.
 * Real dashboard data comes in a later phase.
 */
export default function DashboardPlaceholder() {
  const { profile } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: announcements, isLoading: announcementsLoading } = useAnnouncementsQuery();
  const createAnnouncement = useCreateAnnouncementMutation();

  async function handlePost() {
    await createAnnouncement.mutateAsync({ title, body });
    setTitle("");
    setBody("");
    setNewOpen(false);
  }

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Announcements</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setNewOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Post
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcementsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !announcements || announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    — {a.author.fullName} ({a.author.role.replace("_", " ")})
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          This is a layout placeholder (Phase 4). Real dashboard data and per-role views come in a
          later phase.
        </p>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePost} disabled={!title || !body || createAnnouncement.isPending}>
              {createAnnouncement.isPending ? "Posting…" : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
