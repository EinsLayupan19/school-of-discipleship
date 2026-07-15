import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/features/auth/AuthContext";
import { useBatchesQuery, useClassesQuery } from "@/features/academic/hooks";
import type { Program } from "@/features/academic/api";
import { useActivitiesQuery } from "@/features/activities/hooks";
import { NewActivityDialog } from "@/features/activities/NewActivityDialog";
import { TYPE_OPTIONS, type ActivityType } from "@/features/activities/schemas";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PROGRAMS: { value: Program; label: string }[] = [
  { value: "MDC", label: "MDC" },
  { value: "CC", label: "CC" },
];

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const defaultProgram: Program = profile?.role === "CC_FACILITATOR" ? "CC" : "MDC";

  const [program, setProgram] = useState<Program>(defaultProgram);
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const [type, setType] = useState<ActivityType | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [newOpen, setNewOpen] = useState(false);

  const { data: batches } = useBatchesQuery(program);
  const { data: classes } = useClassesQuery({ program, batchId: batchId || undefined });
  const { data: activities, isLoading } = useActivitiesQuery({
    classId,
    type,
    search: debouncedSearch || undefined,
  });

  const showProgramSwitcher = profile?.role === "SUPER_ADMIN";

  return (
    <AppShell title="Activities">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Activities</h2>
            <p className="text-sm text-muted-foreground">
              Quiz, Assignment, Performance, Recitation scores.
            </p>
          </div>
          {classId && (
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New activity
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
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

          {classId && (
            <>
              <Select value={type} onValueChange={(v) => setType(v as ActivityType | "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {!classId ? (
          <p className="text-sm text-muted-foreground">Select a batch and class.</p>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Perfect Score</TableHead>
                  <TableHead>Scores</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ) : !activities || activities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No activities yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((a) => (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/activities/${a.id}`)}
                    >
                      <TableCell className="font-medium text-foreground">{a.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{a.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.maxScore}</TableCell>
                      <TableCell className="text-muted-foreground">{a.scoreCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.averageScore} ({a.averagePercent}%)
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.isLocked ? "success" : "outline"}>
                          {a.isLocked ? "Submitted" : "Draft"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {classId && <NewActivityDialog open={newOpen} onOpenChange={setNewOpen} classId={classId} />}
    </AppShell>
  );
}
