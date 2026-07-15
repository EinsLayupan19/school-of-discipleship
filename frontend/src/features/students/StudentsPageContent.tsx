import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Plus, Search, Upload } from "lucide-react";
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
import { useAuth } from "@/features/auth/AuthContext";
import { useBatchesQuery, useClassesQuery } from "@/features/academic/hooks";
import type { Program } from "@/features/academic/api";
import {
  useArchiveStudentMutation,
  useCreateStudentMutation,
  useDeleteStudentMutation,
  useStudentsQuery,
  useUnarchiveStudentMutation,
  useUpdateStudentMutation,
} from "./hooks";
import { StudentForm } from "./StudentForm";
import { ImportDialog } from "./ImportDialog";
import {
  CATEGORY_OPTIONS,
  SEX_OPTIONS,
  type StudentFormValues,
  type StudentRecord,
} from "./schemas";

const PAGE_SIZE = 10;

type PendingAction =
  | { type: "archive" | "unarchive"; student: StudentRecord }
  | { type: "delete"; student: StudentRecord }
  | null;

interface StudentsPageContentProps {
  program: Program;
  title: string;
}

export function StudentsPageContent({ program, title }: StudentsPageContentProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "SUPER_ADMIN";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [batchId, setBatchId] = useState<string>("all");
  const [classId, setClassId] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sex, setSex] = useState<string>("all");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const { data: batches } = useBatchesQuery(program);
  const { data: classes } = useClassesQuery({
    program,
    batchId: batchId === "all" ? undefined : batchId,
  });

  const { data, isLoading, isFetching } = useStudentsQuery({
    search: debouncedSearch || undefined,
    batchId: batchId === "all" ? undefined : batchId,
    classId: classId === "all" ? undefined : classId,
    category: category === "all" ? undefined : (category as StudentFormValues["category"]),
    sex: sex === "all" ? undefined : (sex as StudentFormValues["sex"]),
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const createMutation = useCreateStudentMutation();
  const updateMutation = useUpdateStudentMutation();
  const archiveMutation = useArchiveStudentMutation();
  const unarchiveMutation = useUnarchiveStudentMutation();
  const deleteMutation = useDeleteStudentMutation();

  const students = data?.data ?? [];
  const meta = data?.meta;

  function resetPage() {
    setPage(1);
  }

  async function handleCreate(values: StudentFormValues) {
    await createMutation.mutateAsync({
      fullName: values.fullName,
      classId: values.classId,
      groupId: values.groupId || null,
      sex: values.sex,
      category: values.category,
    });
    setCreateOpen(false);
  }

  async function handleUpdate(values: StudentFormValues) {
    if (!editingStudent) return;
    await updateMutation.mutateAsync({
      id: editingStudent.id,
      input: {
        fullName: values.fullName,
        classId: values.classId,
        groupId: values.groupId || null,
        sex: values.sex,
        category: values.category,
      },
    });
    setEditingStudent(null);
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "archive")
      await archiveMutation.mutateAsync(pendingAction.student.id);
    if (pendingAction.type === "unarchive")
      await unarchiveMutation.mutateAsync(pendingAction.student.id);
    if (pendingAction.type === "delete") await deleteMutation.mutateAsync(pendingAction.student.id);
    setPendingAction(null);
  }

  return (
    <AppShell title={title}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">Manage student records for {program}.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New student
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />
          </div>

          <Select
            value={batchId}
            onValueChange={(v) => {
              setBatchId(v);
              setClassId("all");
              resetPage();
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={classId}
            onValueChange={(v) => {
              setClassId(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sex}
            onValueChange={(v) => {
              setSex(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sexes</SelectItem>
              {SEX_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as typeof status);
              resetPage();
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No students match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {student.fullName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.class.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.group?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.sex === "MALE" ? "Male" : "Female"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.isArchived ? "outline" : "success"}>
                        {student.isArchived ? "Archived" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Student actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/students/${student.id}`)}>
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingStudent(student)}>
                            Edit
                          </DropdownMenuItem>
                          {student.isArchived ? (
                            <DropdownMenuItem
                              onClick={() => setPendingAction({ type: "unarchive", student })}
                            >
                              Unarchive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setPendingAction({ type: "archive", student })}
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          {isSuperAdmin && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingAction({ type: "delete", student })}
                            >
                              Delete permanently
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
            <DialogTitle>New student</DialogTitle>
          </DialogHeader>
          <StudentForm
            program={program}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <StudentForm
              program={program}
              defaultValues={{
                fullName: editingStudent.fullName,
                batchId: editingStudent.class.batch.id,
                classId: editingStudent.classId,
                groupId: editingStudent.groupId ?? "",
                sex: editingStudent.sex,
                category: editingStudent.category,
              }}
              onSubmit={handleUpdate}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setEditingStudent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Archive / unarchive / delete confirmation */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "archive" && "Archive this student?"}
              {pendingAction?.type === "unarchive" && "Unarchive this student?"}
              {pendingAction?.type === "delete" && "Permanently delete this student?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "archive" &&
                `${pendingAction.student.fullName} will be hidden from active lists, but their records are kept.`}
              {pendingAction?.type === "unarchive" &&
                `${pendingAction.student.fullName} will reappear in active lists.`}
              {pendingAction?.type === "delete" &&
                `This permanently deletes ${pendingAction.student.fullName} and all their attendance, grade, and demerit records. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
