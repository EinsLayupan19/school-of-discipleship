import { useState } from "react";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupsQuery } from "@/features/academic/hooks";
import { useChipsQuery, useCreateChipMutation } from "./hooks";

export function ChipsWidget({ classId }: { classId: string }) {
  const { data: groups } = useGroupsQuery(classId);
  const { data: chips } = useChipsQuery(classId);
  const create = useCreateChipMutation();

  const [groupId, setGroupId] = useState("");
  const [amount, setAmount] = useState("1");
  const [reason, setReason] = useState("");

  async function handleAward() {
    await create.mutateAsync({ groupId, amount: Number(amount), reason: reason || undefined });
    setReason("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Group Chips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              {groups?.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            className="w-24"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-48"
          />
          <Button
            size="sm"
            disabled={!groupId || !amount || create.isPending}
            onClick={handleAward}
          >
            <Award className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>

        <div className="space-y-1">
          {chips?.slice(0, 8).map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                {c.group.name} {c.amount > 0 ? `+${c.amount}` : c.amount}
                {c.reason ? ` — ${c.reason}` : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
