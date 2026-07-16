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
  usePASessionQuery,
  useSubmitPAMutation,
  useUnlockPAMutation,
  useUpsertPAScoresMutation,
} from "@/features/pa/hooks";
import { RUBRIC_LABELS, type PASessionDetail, type RubricWeights } from "@/features/pa/schemas";

export default function PADetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = usePASessionQuery(id);

  return (
    <AppShell title="PA Session">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {isLoading || !session ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <Editor key={session.id} session={session} />
        )}
      </div>
    </AppShell>
  );
}

type Draft = Record<string, RubricWeights>;

function computeTotal(w: RubricWeights, s: RubricWeights) {
  const total =
    (s.cleanliness * w.cleanliness +
      s.creativity * w.creativity +
      s.execution * w.execution +
      s.teamwork * w.teamwork +
      s.timeManagement * w.timeManagement) /
    100;
  return Math.round(total * 100) / 100;
}

function Editor({ session }: { session: PASessionDetail }) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "SUPER_ADMIN";

  const [draft, setDraft] = useState<Draft>(() => {
    const init: Draft = {};
    session.scores.forEach((s) => {
      init[s.groupId] = {
        cleanliness: s.cleanliness,
        creativity: s.creativity,
        execution: s.execution,
        teamwork: s.teamwork,
        timeManagement: s.timeManagement,
      };
    });
    return init;
  });
  const [unlockReason, setUnlockReason] = useState("");

  const upsert = useUpsertPAScoresMutation(session.id);
  const submit = useSubmitPAMutation(session.id);
  const unlock = useUnlockPAMutation(session.id);

  function setField(groupId: string, field: keyof RubricWeights, value: number) {
    setDraft((d) => ({ ...d, [groupId]: { ...d[groupId], [field]: value } }));
  }

  async function handleSave() {
    await upsert.mutateAsync(Object.entries(draft).map(([groupId, s]) => ({ groupId, ...s })));
  }

  async function handleSubmit() {
    await handleSave();
    await submit.mutateAsync();
  }

  async function handleUnlock() {
    await unlock.mutateAsync(unlockReason);
    setUnlockReason("");
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {new Date(session.sessionDate).toLocaleDateString()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {session.class.name} · {session.class.batch.program} rubric
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
              <TableHead>Group</TableHead>
              {RUBRIC_LABELS.map((r) => (
                <TableHead key={r.key}>
                  {r.label} ({session.rubricWeights[r.key]}%)
                </TableHead>
              ))}
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {session.scores.map((s) => {
              const d = draft[s.groupId];
              const total = d ? computeTotal(session.rubricWeights, d) : s.totalScore;
              return (
                <TableRow key={s.groupId}>
                  <TableCell className="font-medium text-foreground">{s.group.name}</TableCell>
                  {RUBRIC_LABELS.map((r) => (
                    <TableCell key={r.key}>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-20"
                        value={d?.[r.key] ?? 0}
                        onChange={(e) => setField(s.groupId, r.key, Number(e.target.value) || 0)}
                        disabled={session.isLocked}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="font-medium text-foreground">{total}</TableCell>
                </TableRow>
              );
            })}
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
                  <AlertDialogTitle>Submit this session?</AlertDialogTitle>
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
