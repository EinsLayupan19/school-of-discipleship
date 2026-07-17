import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/AuthContext";
import { useBatchesQuery, useClassesQuery, useGroupsQuery } from "@/features/academic/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import { useAttendanceSessionsQuery } from "@/features/attendance/hooks";
import type { Program } from "@/features/academic/api";
import { downloadFile } from "@/lib/downloadFile";

const PROGRAMS: { value: Program; label: string }[] = [
  { value: "MDC", label: "MDC" },
  { value: "CC", label: "CC" },
];

type ReportType = "attendance" | "chips" | "student" | "group" | "category";
type FilterType = "date" | "week" | "month" | "phase";
type Format = "csv" | "xlsx" | "pdf";

function resolveRange(
  filterType: FilterType,
  value: string
): { dateFrom?: string; dateTo?: string } {
  if (!value) return {};
  if (filterType === "date") return { dateFrom: value, dateTo: value };
  if (filterType === "month") {
    const [y, m] = value.split("-").map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }
  if (filterType === "week") {
    const from = new Date(value);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 7);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }
  // "phase" — a coarser custom range; treat as a start date through today.
  return { dateFrom: value, dateTo: new Date().toISOString() };
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const defaultProgram: Program = profile?.role === "CC_FACILITATOR" ? "CC" : "MDC";

  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [program, setProgram] = useState<Program>(defaultProgram);
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("month");
  const [filterValue, setFilterValue] = useState("");
  const [busy, setBusy] = useState(false);

  const showProgramSwitcher = profile?.role === "SUPER_ADMIN";
  const { data: batches } = useBatchesQuery(program);
  const { data: classes } = useClassesQuery({ program, batchId: batchId || undefined });
  const { data: groups } = useGroupsQuery(classId || undefined);
  const { data: studentsData } = useStudentsQuery({ classId, page: 1, pageSize: 100 });
  const { data: sessions } = useAttendanceSessionsQuery(classId || undefined);
  const [sessionId, setSessionId] = useState("");

  const needsClass = reportType !== "student" && reportType !== "group";
  const needsStudent = reportType === "student";
  const needsGroup = reportType === "group";
  const needsDateFilter = reportType === "attendance" || reportType === "chips";

  async function handleExport(format: Format) {
    setBusy(true);
    try {
      const { dateFrom, dateTo } = needsDateFilter ? resolveRange(filterType, filterValue) : {};
      const qs = new URLSearchParams({ format });
      if (dateFrom) qs.set("dateFrom", dateFrom);
      if (dateTo) qs.set("dateTo", dateTo);

      let path = "";
      if (reportType === "attendance") path = `/reports/attendance?classId=${classId}&${qs}`;
      else if (reportType === "chips") path = `/reports/chips?classId=${classId}&${qs}`;
      else if (reportType === "category") path = `/reports/category?classId=${classId}&${qs}`;
      else if (reportType === "student") path = `/reports/student/${studentId}?${qs}`;
      else if (reportType === "group") path = `/reports/group/${groupId}?${qs}`;

      await downloadFile(path);
    } finally {
      setBusy(false);
    }
  }

  async function handlePrintSheet() {
    if (!sessionId) return;
    setBusy(true);
    try {
      await downloadFile(`/reports/attendance-sheet?attendanceId=${sessionId}`);
    } finally {
      setBusy(false);
    }
  }

  const canExport =
    (reportType === "student" && !!studentId) ||
    (reportType === "group" && !!groupId) ||
    (needsClass && !needsStudent && !needsGroup && !!classId);

  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Export records for meetings and record keeping.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="chips">Chips Report</SelectItem>
                  <SelectItem value="student">Student Profile Report</SelectItem>
                  <SelectItem value="group">Group Report</SelectItem>
                  <SelectItem value="category">Category Report</SelectItem>
                </SelectContent>
              </Select>

              {showProgramSwitcher && (
                <Select
                  value={program}
                  onValueChange={(v) => {
                    setProgram(v as Program);
                    setBatchId("");
                    setClassId("");
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAMS.map((o) => (
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Batch" />
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {needsStudent && (
                <Select value={studentId} onValueChange={setStudentId} disabled={!classId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsData?.data.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {needsGroup && (
                <Select value={groupId} onValueChange={setGroupId} disabled={!classId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {needsDateFilter && (
              <div className="flex flex-wrap items-center gap-3">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="phase">Phase</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type={filterType === "month" ? "month" : "date"}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
                <span className="text-xs text-muted-foreground">Leave blank for all records</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button disabled={!canExport || busy} onClick={() => handleExport("csv")}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button disabled={!canExport || busy} onClick={() => handleExport("xlsx")}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button disabled={!canExport || busy} onClick={() => handleExport("pdf")}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Printable Attendance Sheet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Select value={sessionId} onValueChange={setSessionId} disabled={!classId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {new Date(s.sessionDate).toLocaleDateString()}
                    {s.topic ? ` — ${s.topic}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!sessionId || busy} onClick={handlePrintSheet}>
              <Printer className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
