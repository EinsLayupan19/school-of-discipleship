import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/AuthContext";
import { useUnlockWeekMutation, useUpdateWeekMutation } from "./hooks";
import { CHECKLIST_ITEMS, STATUS_LABELS, type WeekRecord, type WeekStatus } from "./schemas";
import type { UpdateWeekPayload } from "./api";

const STATUS_BADGE_VARIANT: Record<WeekStatus, "secondary" | "success" | "outline"> = {
  NOT_STARTED: "outline",
  IN_PROGRESS: "secondary",
  COMPLETED: "success",
};

interface WeekCardProps {
  week: WeekRecord;
  batchId: string;
}

export function WeekCard({ week, batchId }: WeekCardProps) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "SUPER_ADMIN";

  const [draft, setDraft] = useState<UpdateWeekPayload>({
    attendanceDone: week.attendanceDone,
    quizDone: week.quizDone,
    assignmentDone: week.assignmentDone,
    recitationDone: week.recitationDone,
    performanceDone: week.performanceDone,
    paDone: week.paDone,
    groupChipsDone: week.groupChipsDone,
    notes: week.notes ?? "",
    status: week.status,
  });
  const [unlockReason, setUnlockReason] = useState("");

  const updateMutation = useUpdateWeekMutation(batchId);
  const unlockMutation = useUnlockWeekMutation(batchId);

  function toggleItem(field: keyof WeekRecord) {
    setDraft((d) => ({ ...d, [field]: !d[field as keyof UpdateWeekPayload] }));
  }

  async function handleSave() {
    await updateMutation.mutateAsync({ id: week.id, input: draft });
  }

  async function handleUnlock() {
    await unlockMutation.mutateAsync({ id: week.id, reason: unlockReason });
    setUnlockReason("");
  }

  const isDirty =
    JSON.stringify(draft) !==
    JSON.stringify({
      attendanceDone: week.attendanceDone,
      quizDone: week.quizDone,
      assignmentDone: week.assignmentDone,
      recitationDone: week.recitationDone,
      performanceDone: week.performanceDone,
      paDone: week.paDone,
      groupChipsDone: week.groupChipsDone,
      notes: week.notes ?? "",
      status: week.status,
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">
            Week {week.weekNumber}
            {week.label ? ` — ${week.label}` : ""}
          </CardTitle>
          {week.completedBy && (
            <p className="mt-1 text-xs text-muted-foreground">
              Completed by {week.completedBy.fullName}
              {week.completedAt ? ` on ${new Date(week.completedAt).toLocaleDateString()}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {week.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
          <Badge variant={STATUS_BADGE_VARIANT[week.status]}>{STATUS_LABELS[week.status]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{week.progressPercent}%</span>
          </div>
          <Progress value={week.progressPercent} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CHECKLIST_ITEMS.map((item) => (
            <div key={item.field} className="flex items-center gap-2">
              <Checkbox
                id={`${week.id}-${item.field}`}
                checked={!!draft[item.field as keyof UpdateWeekPayload]}
                onCheckedChange={() => toggleItem(item.field)}
                disabled={week.isLocked}
              />
              <Label
                htmlFor={`${week.id}-${item.field}`}
                className="cursor-pointer text-sm font-normal"
              >
                {item.label}
              </Label>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${week.id}-notes`}>Notes</Label>
          <Textarea
            id={`${week.id}-notes`}
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            disabled={week.isLocked}
            rows={2}
          />
        </div>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="w-full space-y-2 sm:w-48">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(value) => setDraft((d) => ({ ...d, status: value as WeekStatus }))}
              disabled={week.isLocked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {week.isLocked && isSuperAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unlock Week {week.weekNumber}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This week was marked Completed and is currently locked. Provide a reason —
                      it's recorded in the audit trail.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor={`${week.id}-unlock-reason`}>Reason</Label>
                    <Input
                      id={`${week.id}-unlock-reason`}
                      value={unlockReason}
                      onChange={(e) => setUnlockReason(e.target.value)}
                      placeholder="e.g. Facilitator needs to correct attendance"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUnlockReason("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={unlockReason.trim().length < 3}
                      onClick={handleUnlock}
                    >
                      Unlock
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {!week.isLocked && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
