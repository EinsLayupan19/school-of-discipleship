export type ActivityType = "QUIZ" | "ASSIGNMENT" | "PERFORMANCE" | "RECITATION";

export const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "PERFORMANCE", label: "Performance" },
  { value: "RECITATION", label: "Recitation" },
];

export interface ActivityListItem {
  id: string;
  title: string;
  type: ActivityType;
  maxScore: number;
  classId: string;
  isLocked: boolean;
  scoreCount: number;
  averageScore: number;
  averagePercent: number;
  createdAt: string;
}

export interface RankedScore {
  studentId: string;
  fullName: string;
  score: number;
  percent: number;
  isPerfect: boolean;
  rank: number;
}

export interface ActivityDetail extends ActivityListItem {
  ranked: RankedScore[];
  class: { id: string; name: string };
}
