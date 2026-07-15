import { useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useCreateUserMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useResetPasswordMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/hooks";
import { UserForm } from "@/features/users/UserForm";
import { TempPasswordDialog } from "@/features/users/TempPasswordDialog";
import {
  ROLE_OPTIONS,
  type CreateUserValues,
  type UpdateUserValues,
  type UserRecord,
} from "@/features/users/schemas";
import type { Role } from "@/features/auth/AuthContext";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  MDC_FACILITATOR: "MDC Facilitator",
  CC_FACILITATOR: "CC Facilitator",
};

const PAGE_SIZE = 10;

type PendingAction =
  | { type: "deactivate" | "reactivate"; user: UserRecord }
  | { type: "reset-password"; user: UserRecord }
  | null;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [status, setStatus] = useState<"active" | "inactive" | "all">("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(
    null
  );

  const { data, isLoading, isFetching } = useUsersQuery({
    search: debouncedSearch || undefined,
    role,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deactivateMutation = useDeactivateUserMutation();
  const reactivateMutation = useReactivateUserMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  const users = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
  }

  async function handleCreate(values: CreateUserValues | UpdateUserValues) {
    const result = await createMutation.mutateAsync(values as CreateUserValues);
    setCreateOpen(false);
    setTempPassword({ email: result.data.email, password: result.tempPassword });
  }

  async function handleUpdate(values: CreateUserValues | UpdateUserValues) {
    if (!editingUser) return;
    await updateMutation.mutateAsync({ id: editingUser.id, input: values as UpdateUserValues });
    setEditingUser(null);
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    if (pendingAction.type === "deactivate") {
      await deactivateMutation.mutateAsync(pendingAction.user.id);
    } else if (pendingAction.type === "reactivate") {
      await reactivateMutation.mutateAsync(pendingAction.user.id);
    } else if (pendingAction.type === "reset-password") {
      const result = await resetPasswordMutation.mutateAsync(pendingAction.user.id);
      setTempPassword({ email: pendingAction.user.email, password: result.tempPassword });
    }

    setPendingAction(null);
  }

  return (
    <AppShell title="Users">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">User Management</h2>
            <p className="text-sm text-muted-foreground">Create and manage facilitator accounts.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New user
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>

          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value as Role | "all");
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as "active" | "inactive" | "all");
              resetToFirstPage();
            }}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No users match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "outline"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="User actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPendingAction({ type: "reset-password", user })}
                          >
                            Reset password
                          </DropdownMenuItem>
                          {user.isActive ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingAction({ type: "deactivate", user })}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setPendingAction({ type: "reactivate", user })}
                            >
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
          </DialogHeader>
          <UserForm
            mode="create"
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              mode="edit"
              defaultValues={{ fullName: editingUser.fullName, role: editingUser.role }}
              onSubmit={handleUpdate}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setEditingUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate / reactivate / reset-password confirmation */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "deactivate" && "Deactivate this user?"}
              {pendingAction?.type === "reactivate" && "Reactivate this user?"}
              {pendingAction?.type === "reset-password" && "Reset this user's password?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "deactivate" &&
                `${pendingAction.user.fullName} will immediately lose access and won't be able to log in.`}
              {pendingAction?.type === "reactivate" &&
                `${pendingAction.user.fullName} will be able to log in again.`}
              {pendingAction?.type === "reset-password" &&
                `A new temporary password will be generated for ${pendingAction.user.fullName}. Their current password will stop working.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* One-time temp password reveal */}
      {tempPassword && (
        <TempPasswordDialog
          open={!!tempPassword}
          onOpenChange={(open) => !open && setTempPassword(null)}
          email={tempPassword.email}
          password={tempPassword.password}
        />
      )}
    </AppShell>
  );
}
