import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Unlock } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useAttendanceSessionQuery,
  useSubmitAttendanceMutation,
  useUnlockAttendanceMutation,
  useUpdateRecordsMutation,
} from "@/features/attendance/hooks";
import {
  STATUS_OPTIONS,
  type AttendanceSessionDetail,
  type AttendanceStatus,
} from "@/features/attendance/schemas";
import type { RecordUpdate } from "@/features/attendance/api";

export default function AttendanceSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useAttendanceSessionQuery(id);

  return (
    <AppShell title="Attendance Session">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {isLoading || !session ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          // key={session.id} forces a fresh mount (and fresh draft state) whenever the
          // session identity changes, instead of syncing fetched data into state via an effect.
          <SessionEditor key={session.id} session={session} />
        )}
      </div>
    </AppShell>
  );
}

function SessionEditor({ session }: { session: AttendanceSessionDetail }) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "SUPER_ADMIN";

  const [draft, setDraft] = useState<Record<string, RecordUpdate>>(() => {
    const initial: Record<string, RecordUpdate> = {};
    session.records.forEach((r) => {
      initial[r.studentId] = { studentId: r.studentId, status: r.status, remarks: r.remarks ?? "" };
    });
    return initial;
  });
  const [unlockReason, setUnlockReason] = useState("");

  const updateMutation = useUpdateRecordsMutation(session.id);
  const submitMutation = useSubmitAttendanceMutation(session.id);
  const unlockMutation = useUnlockAttendanceMutation(session.id);

  function updateStatus(studentId: string, status: AttendanceStatus) {
    setDraft((d) => ({ ...d, [studentId]: { ...d[studentId], status } }));
  }

  function updateRemarks(studentId: string, remarks: string) {
    setDraft((d) => ({ ...d, [studentId]: { ...d[studentId], remarks } }));
  }

  async function handleSave() {
    await updateMutation.mutateAsync(Object.values(draft));
  }

  async function handleSubmit() {
    await handleSave();
    await submitMutation.mutateAsync();
  }

  async function handleUnlock() {
    await unlockMutation.mutateAsync(unlockReason);
    setUnlockReason("");
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {new Date(session.sessionDate).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {session.class.name} · {session.class.batch.name}
            {session.topic ? ` · ${session.topic}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
          <Badge variant={session.isLocked ? "success" : "outline"}>
            {session.isLocked ? "Submitted" : "Draft"}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {session.records.map((record) => (
              <TableRow key={record.studentId}>
                <TableCell className="font-medium text-foreground">
                  {record.student.fullName}
                </TableCell>
                <TableCell>
                  <Select
                    value={draft[record.studentId]?.status}
                    onValueChange={(value) =>
                      updateStatus(record.studentId, value as AttendanceStatus)
                    }
                    disabled={session.isLocked}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={draft[record.studentId]?.remarks ?? ""}
                    onChange={(e) => updateRemarks(record.studentId, e.target.value)}
                    disabled={session.isLocked}
                    placeholder="Optional"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        {session.isLocked ? (
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
                  <AlertDialogTitle>Unlock this session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This session was submitted and is locked. Provide a reason — it's recorded in
                    the audit trail.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="unlock-reason">Reason</Label>
                  <Input
                    id="unlock-reason"
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                    placeholder="e.g. Correcting a marking error"
                  />
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
            <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save draft"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting…" : "Submit & lock"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit this session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Once submitted, this session locks and can't be edited unless a Super Admin
                    unlocks it.
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
