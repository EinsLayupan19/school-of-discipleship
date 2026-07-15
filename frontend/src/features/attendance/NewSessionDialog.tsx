import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateSundayOptions } from "./schemas";
import { useCreateAttendanceMutation } from "./hooks";

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onCreated: (sessionId: string) => void;
}

function formatSunday(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function NewSessionDialog({
  open,
  onOpenChange,
  classId,
  onCreated,
}: NewSessionDialogProps) {
  const sundays = generateSundayOptions();
  const [sessionDate, setSessionDate] = useState(sundays[2].toISOString()); // defaults to the upcoming/most recent Sunday
  const [topic, setTopic] = useState("");

  const createMutation = useCreateAttendanceMutation(classId);

  async function handleCreate() {
    const result = await createMutation.mutateAsync({ sessionDate, topic: topic || undefined });
    setTopic("");
    onOpenChange(false);
    onCreated(result.data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New attendance session</DialogTitle>
          <DialogDescription>Sessions are held on Sundays — pick the date below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sunday</Label>
            <Select value={sessionDate} onValueChange={setSessionDate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sundays.map((d) => (
                  <SelectItem key={d.toISOString()} value={d.toISOString()}>
                    {formatSunday(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic (optional)</Label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive">{(createMutation.error as Error).message}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
