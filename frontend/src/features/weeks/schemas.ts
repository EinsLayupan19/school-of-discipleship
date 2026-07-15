export type WeekStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface WeekRecord {
  id: string;
  batchId: string;
  weekNumber: number;
  label: string | null;
  attendanceDone: boolean;
  quizDone: boolean;
  assignmentDone: boolean;
  recitationDone: boolean;
  performanceDone: boolean;
  paDone: boolean;
  groupChipsDone: boolean;
  notes: string | null;
  status: WeekStatus;
  isLocked: boolean;
  completedBy: { id: string; fullName: string } | null;
  completedAt: string | null;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export const CHECKLIST_ITEMS: { field: keyof WeekRecord; label: string }[] = [
  { field: "attendanceDone", label: "Attendance" },
  { field: "quizDone", label: "Quiz" },
  { field: "assignmentDone", label: "Assignment" },
  { field: "recitationDone", label: "Recitation" },
  { field: "performanceDone", label: "Performance" },
  { field: "paDone", label: "PA" },
  { field: "groupChipsDone", label: "Group Chips" },
];

export const STATUS_LABELS: Record<WeekStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};
