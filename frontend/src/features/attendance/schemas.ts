export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export interface AttendanceRecordItem {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  remarks: string | null;
  student: { id: string; fullName: string };
}

export interface AttendanceSummary {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  total: number;
  percentage: number;
}

export interface AttendanceSessionListItem {
  id: string;
  classId: string;
  sessionDate: string;
  topic: string | null;
  isLocked: boolean;
  lockedBy: { id: string; fullName: string } | null;
  lockedAt: string | null;
  summary: AttendanceSummary;
}

export interface AttendanceSessionDetail extends AttendanceSessionListItem {
  records: AttendanceRecordItem[];
  class: { id: string; name: string; batch: { id: string; name: string; program: "MDC" | "CC" } };
}

export interface StudentDashboardStat extends AttendanceSummary {
  studentId: string;
  fullName: string;
  dropWarning: boolean;
}

export interface AttendanceDashboard {
  totalSessions: number;
  classAveragePercent: number;
  studentsOnDropWarning: number;
  students: StudentDashboardStat[];
}

export const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Excused" },
];

/** Returns the most recent Sunday plus the next several, for the session-date picker. */
export function generateSundayOptions(count = 10): Date[] {
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const mostRecentSunday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dayOfWeek)
  );

  const sundays: Date[] = [];
  for (let i = -2; i < count - 2; i++) {
    const d = new Date(mostRecentSunday);
    d.setUTCDate(d.getUTCDate() + i * 7);
    sundays.push(d);
  }
  return sundays;
}
