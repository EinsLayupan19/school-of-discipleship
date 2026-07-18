import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/apiClient";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleClose(next: boolean) {
    if (!next) {
      setNewPassword("");
      setError(null);
      setDone(false);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        {done ? (
          <p className="text-sm text-foreground">Password updated.</p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {done ? "Close" : "Cancel"}
          </Button>
          {!done && (
            <Button disabled={newPassword.length < 8 || busy} onClick={handleSubmit}>
              {busy ? "Saving…" : "Change password"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
