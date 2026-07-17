import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Settings,
  ScrollText,
  CalendarClock,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  BarChart3,
  FileDown,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/features/auth/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omit to show for every role. */
  roles?: Role[];
}

// Static nav structure only — no data, no permissions logic beyond simple
// role filtering. Actual pages/routes for these land in later phases.
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "MDC", href: "/mdc", icon: GraduationCap, roles: ["SUPER_ADMIN", "MDC_FACILITATOR"] },
  { label: "CC", href: "/cc", icon: GraduationCap, roles: ["SUPER_ADMIN", "CC_FACILITATOR"] },
  { label: "Weeks", href: "/weeks", icon: CalendarClock },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { label: "Activities", href: "/activities", icon: FileText },
  { label: "Physical Arrangement", href: "/pa", icon: LayoutGrid },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileDown },
  { label: "Users", href: "/users", icon: Users, roles: ["SUPER_ADMIN"] },
  { label: "Audit Logs", href: "/audit-logs", icon: ScrollText, roles: ["SUPER_ADMIN"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
];

interface SidebarProps {
  role: Role | undefined;
  /** Controls the mobile slide-in drawer; ignored on desktop (always visible). */
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            School of Discipleship
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
