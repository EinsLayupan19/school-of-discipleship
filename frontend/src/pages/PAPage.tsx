import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
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
import { useAuth } from "@/features/auth/AuthContext";
import { useBatchesQuery, useClassesQuery } from "@/features/academic/hooks";
import type { Program } from "@/features/academic/api";
import { usePASessionsQuery } from "@/features/pa/hooks";
import { NewPASessionDialog } from "@/features/pa/NewPASessionDialog";

const PROGRAMS: { value: Program; label: string }[] = [
  { value: "MDC", label: "MDC" },
  { value: "CC", label: "CC" },
];

export default function PAPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const defaultProgram: Program = profile?.role === "CC_FACILITATOR" ? "CC" : "MDC";

  const [program, setProgram] = useState<Program>(defaultProgram);
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const { data: batches } = useBatchesQuery(program);
  const { data: classes } = useClassesQuery({ program, batchId: batchId || undefined });
  const { data: sessions, isLoading } = usePASessionsQuery(classId || undefined);

  const showProgramSwitcher = profile?.role === "SUPER_ADMIN";

  return (
    <AppShell title="Physical Arrangement">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Physical Arrangement</h2>
            <p className="text-sm text-muted-foreground">Grade each group's PA per session.</p>
          </div>
          {classId && (
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New session
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
        </div>

        {!classId ? (
          <p className="text-sm text-muted-foreground">Select a batch and class.</p>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Groups Scored</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ) : !sessions || sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No sessions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/pa/${s.id}`)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {new Date(s.sessionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.topic ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.scores.length}</TableCell>
                      <TableCell>
                        <Badge variant={s.isLocked ? "success" : "outline"}>
                          {s.isLocked ? "Submitted" : "Draft"}
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

      {classId && (
        <NewPASessionDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          classId={classId}
          onCreated={(id) => navigate(`/pa/${id}`)}
        />
      )}
    </AppShell>
  );
}
