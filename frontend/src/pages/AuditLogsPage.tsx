import { useState } from "react";
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
import { useAuditLogsQuery } from "@/features/audit/api";

const PAGE_SIZE = 20;

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "success"> = {
  CREATE: "success",
  UPDATE: "secondary",
  DELETE: "destructive",
  DEACTIVATE: "destructive",
  REACTIVATE: "success",
  RESET_PASSWORD: "secondary",
  UNLOCK: "secondary",
  LOGIN: "secondary",
  LOGOUT: "secondary",
  GRADE_OVERRIDE: "secondary",
};

function formatAction(action: string) {
  return action
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useAuditLogsQuery({
    entityType: entityType === "all" ? undefined : entityType,
    page,
    pageSize: PAGE_SIZE,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AppShell title="Audit Logs">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Audit Logs</h2>
          <p className="text-sm text-muted-foreground">
            A record of every important action taken in the system.
          </p>
        </div>

        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            <SelectItem value="User">User</SelectItem>
          </SelectContent>
        </Select>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No audit log entries yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{log.actor.fullName}</div>
                      <div className="text-xs text-muted-foreground">{log.actor.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[log.action] ?? "secondary"}>
                        {formatAction(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.entityType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
