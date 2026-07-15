import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarCheck, Plus, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/features/auth/AuthContext";
import { useBatchesQuery, useClassesQuery } from "@/features/academic/hooks";
import type { Program } from "@/features/academic/api";
import {
  useAttendanceDashboardQuery,
  useAttendanceSessionsQuery,
} from "@/features/attendance/hooks";
import { NewSessionDialog } from "@/features/attendance/NewSessionDialog";

const PROGRAM_OPTIONS: { value: Program; label: string }[] = [
  { value: "MDC", label: "MDC" },
  { value: "CC", label: "CC" },
];

export default function AttendancePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const defaultProgram: Program = profile?.role === "CC_FACILITATOR" ? "CC" : "MDC";
  const [program, setProgram] = useState<Program>(defaultProgram);
  const [batchId, setBatchId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [newSessionOpen, setNewSessionOpen] = useState(false);

  const { data: batches } = useBatchesQuery(program);
  const { data: classes } = useClassesQuery({ program, batchId: batchId || undefined });
  const { data: dashboard, isLoading: dashboardLoading } = useAttendanceDashboardQuery(
    classId || undefined
  );
  const { data: sessions, isLoading: sessionsLoading } = useAttendanceSessionsQuery(
    classId || undefined
  );

  const showProgramSwitcher = profile?.role === "SUPER_ADMIN";

  return (
    <AppShell title="Attendance">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Attendance</h2>
          <p className="text-sm text-muted-foreground">
            Take Sunday attendance, track percentages, and watch for drop warnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {showProgramSwitcher && (
            <Select
              value={program}
              onValueChange={(v) => {
                setProgram(v as Program);
                setBatchId("");
                setClassId("");
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={batchId}
            onValueChange={(v) => {
              setBatchId(v);
              setClassId("");
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              {batches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classId} onValueChange={setClassId} disabled={!batchId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {classId && (
            <Button onClick={() => setNewSessionOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New session
            </Button>
          )}
        </div>

        {!classId ? (
          <p className="text-sm text-muted-foreground">
            Select a batch and class to view attendance.
          </p>
        ) : (
          <>
            {/* Dashboard */}
            {dashboardLoading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : dashboard ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total Sessions"
                  value={dashboard.totalSessions}
                  icon={CalendarCheck}
                />
                <StatCard
                  label="Class Average"
                  value={`${dashboard.classAveragePercent}%`}
                  icon={Users}
                />
                <StatCard
                  label="Drop Warnings"
                  value={dashboard.studentsOnDropWarning}
                  icon={AlertTriangle}
                  description="Students with 3+ absences"
                />
              </div>
            ) : null}

            {/* Per-student percentage table */}
            {dashboard && dashboard.students.length > 0 && (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.students.map((s) => (
                      <TableRow key={s.studentId}>
                        <TableCell className="font-medium text-foreground">{s.fullName}</TableCell>
                        <TableCell className="text-muted-foreground">{s.presentCount}</TableCell>
                        <TableCell className="text-muted-foreground">{s.lateCount}</TableCell>
                        <TableCell className="text-muted-foreground">{s.absentCount}</TableCell>
                        <TableCell className="text-muted-foreground">{s.percentage}%</TableCell>
                        <TableCell>
                          {s.dropWarning && (
                            <Badge variant="destructive">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Drop warning
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* History */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Session History</h3>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ) : !sessions || sessions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          No sessions yet. Click "New session" to take attendance.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((session) => (
                        <TableRow
                          key={session.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/attendance/${session.id}`)}
                        >
                          <TableCell className="font-medium text-foreground">
                            {new Date(session.sessionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.topic ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.summary.presentCount}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.summary.lateCount}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.summary.absentCount}
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.isLocked ? "success" : "outline"}>
                              {session.isLocked ? "Submitted" : "Draft"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>

      <NewSessionDialog
        open={newSessionOpen}
        onOpenChange={setNewSessionOpen}
        classId={classId}
        onCreated={(sessionId) => navigate(`/attendance/${sessionId}`)}
      />
    </AppShell>
  );
}
