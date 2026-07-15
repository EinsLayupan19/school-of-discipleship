import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
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
import { useCreateWeekMutation, useWeeksQuery } from "@/features/weeks/hooks";
import { WeekCard } from "@/features/weeks/WeekCard";

const PROGRAM_OPTIONS: { value: Program; label: string }[] = [
  { value: "MDC", label: "MDC" },
  { value: "CC", label: "CC" },
];

export default function WeeksPage() {
  const { profile } = useAuth();

  // Facilitators only see their own program by default; Super Admin can switch.
  const defaultProgram: Program = profile?.role === "CC_FACILITATOR" ? "CC" : "MDC";
  const [program, setProgram] = useState<Program>(defaultProgram);
  const [batchId, setBatchId] = useState<string>("");

  const { data: batches, isLoading: batchesLoading } = useBatchesQuery(program);
  const { data: weeks, isLoading: weeksLoading } = useWeeksQuery(batchId || undefined);
  const createMutation = useCreateWeekMutation(batchId || undefined);

  const showProgramSwitcher = profile?.role === "SUPER_ADMIN";

  return (
    <AppShell title="Week Manager">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Week Manager</h2>
          <p className="text-sm text-muted-foreground">
            Track each week's attendance, quiz, assignment, and other checklist items per batch.
          </p>
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

          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={batchesLoading ? "Loading…" : "Select a batch"} />
            </SelectTrigger>
            <SelectContent>
              {batches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {batchId && (
            <Button
              variant="outline"
              onClick={() => createMutation.mutate(undefined)}
              disabled={createMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Adding…" : "Add week"}
            </Button>
          )}
        </div>

        {!batchId ? (
          <p className="text-sm text-muted-foreground">Select a batch to view its weeks.</p>
        ) : weeksLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !weeks || weeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No weeks yet for this batch. Click "Add week" to create Week 1.
          </p>
        ) : (
          <div className="space-y-4">
            {weeks.map((week) => (
              <WeekCard key={week.id} week={week} batchId={batchId} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
