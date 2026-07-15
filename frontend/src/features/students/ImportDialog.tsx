import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useImportStudentsMutation } from "./hooks";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const importMutation = useImportStudentsMutation();
  const result = importMutation.data;

  async function handleImport() {
    if (!file) return;
    await importMutation.mutateAsync(file);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setFile(null);
      importMutation.reset();
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import students from Excel</DialogTitle>
          <DialogDescription>
            Expected columns: Full Name, Sex, Category, Class, Group (optional), Batch (optional —
            only needed if two classes share the same name).
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-2">
            <Label htmlFor="import-file">Excel file (.xlsx)</Label>
            <Input
              id="import-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {importMutation.isError && (
          <p className="text-sm text-destructive">{(importMutation.error as Error).message}</p>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="success">{result.successCount} imported</Badge>
              {result.errorCount > 0 && (
                <Badge variant="destructive">{result.errorCount} skipped</Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-3 text-xs text-muted-foreground">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
              {importMutation.isPending ? "Importing…" : "Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
