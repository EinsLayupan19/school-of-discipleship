import { useState } from "react";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { downloadFile } from "@/lib/downloadFile";

interface UnlockLogRow {
  id: string;
  entityType: string;
  entityId: string;
  reason: string;
  createdAt: string;
  actor: { fullName: string; email: string };
}

const PERMISSIONS = [
  { area: "Users", superAdmin: "Full", mdc: "None", cc: "None" },
  {
    area: "MDC Students / Attendance / Activities / PA",
    superAdmin: "Full",
    mdc: "Own classes",
    cc: "None",
  },
  {
    area: "CC Students / Attendance / Activities / PA",
    superAdmin: "Full",
    mdc: "None",
    cc: "Own classes",
  },
  { area: "Weeks", superAdmin: "Full", mdc: "Own batches", cc: "Own batches" },
  { area: "Unlock records", superAdmin: "Yes", mdc: "No", cc: "No" },
  { area: "Audit logs / Security", superAdmin: "Full", mdc: "None", cc: "None" },
];

export default function SecurityPage() {
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["unlock-logs"],
    queryFn: () =>
      apiFetch<{ success: true; data: UnlockLogRow[] }>(
        "/security/unlock-logs?page=1&pageSize=20"
      ).then((r) => r.data),
  });

  async function handleBackup() {
    setBusy(true);
    try {
      await downloadFile("/security/backup");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Security">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <p className="text-sm text-muted-foreground">Accountability and data protection tools.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unlock Request Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data || data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No unlocks yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-foreground">{u.actor.fullName}</TableCell>
                        <TableCell className="text-muted-foreground">{u.entityType}</TableCell>
                        <TableCell className="text-muted-foreground">{u.reason}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>Super Admin</TableHead>
                  <TableHead>MDC Facilitator</TableHead>
                  <TableHead>CC Facilitator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSIONS.map((p) => (
                  <TableRow key={p.area}>
                    <TableCell className="text-foreground">{p.area}</TableCell>
                    <TableCell className="text-muted-foreground">{p.superAdmin}</TableCell>
                    <TableCell className="text-muted-foreground">{p.mdc}</TableCell>
                    <TableCell className="text-muted-foreground">{p.cc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Downloads a JSON export of all core records. Restore isn't offered here — use
              Supabase's point-in-time recovery for actual data restoration, since blind re-imports
              risk breaking referential integrity.
            </p>
            <Button disabled={busy} onClick={handleBackup}>
              <Download className="mr-2 h-4 w-4" />
              {busy ? "Preparing…" : "Download backup"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
