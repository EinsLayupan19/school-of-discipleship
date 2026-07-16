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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateSundayOptions } from "@/features/attendance/schemas";
import { useCreatePAMutation } from "./hooks";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  classId: string;
  onCreated: (id: string) => void;
}

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function NewPASessionDialog({ open, onOpenChange, classId, onCreated }: Props) {
  const sundays = generateSundayOptions();
  const [sessionDate, setSessionDate] = useState(sundays[2].toISOString());
  const [topic, setTopic] = useState("");
  const create = useCreatePAMutation(classId);

  async function handleCreate() {
    const result = await create.mutateAsync({ sessionDate, topic: topic || undefined });
    setTopic("");
    onOpenChange(false);
    onCreated(result.data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New PA session</DialogTitle>
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
                    {fmt(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic (optional)</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          {create.isError && (
            <p className="text-sm text-destructive">{(create.error as Error).message}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
