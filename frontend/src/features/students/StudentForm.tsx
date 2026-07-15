import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useBatchesQuery, useClassesQuery, useGroupsQuery } from "@/features/academic/hooks";
import type { Program } from "@/features/academic/api";
import {
  CATEGORY_OPTIONS,
  SEX_OPTIONS,
  studentFormSchema,
  type StudentFormValues,
} from "./schemas";

interface StudentFormProps {
  program: Program;
  defaultValues?: Partial<StudentFormValues>;
  onSubmit: (values: StudentFormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function StudentForm({
  program,
  defaultValues,
  onSubmit,
  isSubmitting,
  onCancel,
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
  });

  const batchId = watch("batchId");
  const classId = watch("classId");
  const groupId = watch("groupId");
  const sex = watch("sex");
  const category = watch("category");

  const { data: batches, isLoading: batchesLoading } = useBatchesQuery(program);
  const { data: classes, isLoading: classesLoading } = useClassesQuery({ program, batchId });
  const { data: groups } = useGroupsQuery(classId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Batch</Label>
          <Select
            value={batchId}
            onValueChange={(value) => {
              setValue("batchId", value);
              setValue("classId", "");
              setValue("groupId", "");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={batchesLoading ? "Loading…" : "Select batch"} />
            </SelectTrigger>
            <SelectContent>
              {batches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.batchId && <p className="text-sm text-destructive">{errors.batchId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Class</Label>
          <Select
            value={classId}
            onValueChange={(value) => {
              setValue("classId", value);
              setValue("groupId", "");
            }}
            disabled={!batchId}
          >
            <SelectTrigger>
              <SelectValue placeholder={classesLoading ? "Loading…" : "Select class"} />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.classId && <p className="text-sm text-destructive">{errors.classId.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Group (optional)</Label>
        <Select
          value={groupId || "none"}
          onValueChange={(value) => setValue("groupId", value === "none" ? "" : value)}
          disabled={!classId}
        >
          <SelectTrigger>
            <SelectValue placeholder="No group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No group</SelectItem>
            {groups?.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sex</Label>
          <Select
            value={sex}
            onValueChange={(value) => setValue("sex", value as StudentFormValues["sex"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              {SEX_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sex && <p className="text-sm text-destructive">{errors.sex.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(value) => setValue("category", value as StudentFormValues["category"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
