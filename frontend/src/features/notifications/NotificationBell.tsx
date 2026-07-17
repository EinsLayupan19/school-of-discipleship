import { Bell, CalendarClock, AlertTriangle, Clock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/hooks";

const ICONS: Record<string, typeof Bell> = {
  UNLOCK: Unlock,
  UPCOMING_SESSION: CalendarClock,
  DROP_WARNING: AlertTriangle,
  PENDING_ACTION: Clock,
  ANNOUNCEMENT: Bell,
};

export function NotificationBell() {
  const { data } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const markAllRead = useMarkAllReadMutation();

  const unreadCount = data?.unreadCount ?? 0;
  const items = [...(data?.reminders ?? []), ...(data?.persisted ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {(data?.persisted.some((n) => !n.isRead) ?? false) && (
            <button
              className="text-xs font-normal text-accent hover:underline"
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              const isPersisted = "isRead" in n;
              return (
                <DropdownMenuItem
                  key={n.id}
                  className="flex items-start gap-2 whitespace-normal py-2"
                  onClick={() => isPersisted && !n.isRead && markRead.mutate(n.id)}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-tight text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                  {isPersisted && !n.isRead && (
                    <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
