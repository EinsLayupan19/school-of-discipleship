import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Star, Unlock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/features/auth/AuthContext";
import {
  useActivityQuery,
  useSubmitActivityMutation,
  useUnlockActivityMutation,
  useUpsertScoresMutation,
} from "@/features/activities/hooks";
import type { ActivityDetail } from "@/features/activities/schemas";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: activity, isLoading } = useActivityQuery(id);

  return (
    <AppShell title="Activity">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {isLoading || !activity ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <Editor key={activity.id} activity={activity} />
        )}
      </div>
    </AppShell>
  );
}

function Editor({ activity }: { activity: ActivityDetail }) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "SUPER_ADMIN";

  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    activity.ranked.forEach((r) => (init[r.studentId] = String(r.score)));
    return init;
  });
  const [unlockReason, setUnlockReason] = useState("");

  const upsert = useUpsertScoresMutation(activity.id);
  const submit = useSubmitActivityMutation(activity.id);
  const unlock = useUnlockActivityMutation(activity.id);

  async function handleSave() {
    await upsert.mutateAsync(
      Object.entries(draft).map(([studentId, score]) => ({ studentId, score: Number(score) || 0 }))
    );
  }

  async function handleSubmit() {
    await handleSave();
    await submit.mutateAsync();
  }

  async function handleUnlock() {
    await unlock.mutateAsync(unlockReason);
    setUnlockReason("");
  }

  const ranked = [...activity.ranked].sort((a, b) => a.rank - b.rank);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{activity.title}</h2>
          <p className="text-sm text-muted-foreground">
            {activity.type} · Perfect score: {activity.maxScore}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activity.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
          <Badge variant={activity.isLocked ? "success" : "outline"}>
            {activity.isLocked ? "Submitted" : "Draft"}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="w-32">Score</TableHead>
              <TableHead>Percent</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((r) => (
              <TableRow key={r.studentId}>
                <TableCell className="text-muted-foreground">#{r.rank}</TableCell>
                <TableCell className="font-medium text-foreground">{r.fullName}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max={activity.maxScore}
                    value={draft[r.studentId] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [r.studentId]: e.target.value }))}
                    disabled={activity.isLocked}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{r.percent}%</TableCell>
                <TableCell>
                  {r.isPerfect && (
                    <Badge variant="success">
                      <Star className="mr-1 h-3 w-3" />
                      Perfect
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        {activity.isLocked ? (
          isSuperAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Unlock className="mr-2 h-4 w-4" />
                  Unlock
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlock this activity?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Provide a reason — recorded in the audit trail.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input value={unlockReason} onChange={(e) => setUnlockReason(e.target.value)} />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUnlockReason("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={unlockReason.trim().length < 3}
                    onClick={handleUnlock}
                  >
                    Unlock
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        ) : (
          <>
            <Button variant="outline" onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save draft"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submit.isPending}>
                  {submit.isPending ? "Submitting…" : "Submit & lock"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit this activity?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Locks scores until a Super Admin unlocks it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </>
  );
}
