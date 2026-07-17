import { useState } from "react";
import { Users, CalendarCheck, AlertTriangle, Award, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/AuthContext";
import { useBatchesQuery } from "@/features/academic/hooks";
import type { Program } from "@/features/academic/api";
import { useDashboardQuery } from "@/features/dashboard/hooks";

const PROGRAMS: { value: Program; label: string }[] = [
  { value: "MDC", label: "MDC" },
  { value: "CC", label: "CC" },
];

const PIE_COLORS = ["hsl(221 83% 53%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)"];

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const defaultProgram: Program = profile?.role === "CC_FACILITATOR" ? "CC" : "MDC";
  const [program, setProgram] = useState<Program>(defaultProgram);
  const [batchId, setBatchId] = useState("");

  const { data: batches } = useBatchesQuery(program);
  const { data, isLoading } = useDashboardQuery(batchId || undefined);
  const showProgramSwitcher = profile?.role === "SUPER_ADMIN";

  return (
    <AppShell title="Analytics">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Quick overview of your batch.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {showProgramSwitcher && (
            <Select
              value={program}
              onValueChange={(v) => {
                setProgram(v as Program);
                setBatchId("");
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
          <Select value={batchId} onValueChange={setBatchId}>
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
        </div>

        {!batchId ? (
          <p className="text-sm text-muted-foreground">Select a batch to view analytics.</p>
        ) : isLoading || !data ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Students" value={data.totalStudents} icon={Users} />
              <StatCard
                label="Today"
                value={`${data.today.present}P / ${data.today.late}L / ${data.today.absent}A`}
                icon={CalendarCheck}
              />
              <StatCard
                label="Attendance %"
                value={`${data.attendancePercent}%`}
                icon={TrendingUp}
              />
              <StatCard label="Total Chips" value={data.totalChips} icon={Award} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attendance (last 8 sessions)</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.attendanceChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) =>
                          new Date(d).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                      <Legend />
                      <Bar dataKey="present" fill="hsl(142 71% 45%)" stackId="a" />
                      <Bar dataKey="late" fill="hsl(38 92% 50%)" stackId="a" />
                      <Bar dataKey="absent" fill="hsl(0 72% 51%)" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chips by Group</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chipsChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="totalChips" fill="hsl(221 83% 53%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryStats}
                        dataKey="count"
                        nameKey="category"
                        outerRadius={80}
                        label
                      >
                        {data.categoryStats.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Warning List (3+ absences)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.warningList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students at risk.</p>
                  ) : (
                    data.warningList.map((w) => (
                      <div key={w.studentId} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{w.fullName}</span>
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {w.absentCount} absences
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top 10 Students</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.topStudents.map((s, i) => (
                    <div key={s.studentId} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        #{i + 1} {s.fullName}
                      </span>
                      <span className="text-muted-foreground">{s.percentage}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top 6 Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.topGroups.map((g, i) => (
                    <div key={g.groupId} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        #{i + 1} {g.name}
                      </span>
                      <span className="text-muted-foreground">{g.totalChips} chips</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.recentActivity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {a.actor.fullName} · {a.action} {a.entityType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
