export interface RubricWeights {
  cleanliness: number;
  creativity: number;
  execution: number;
  teamwork: number;
  timeManagement: number;
}

export interface PAScoreRow {
  id: string;
  groupId: string;
  group: { id: string; name: string };
  cleanliness: number;
  creativity: number;
  execution: number;
  teamwork: number;
  timeManagement: number;
  totalScore: number;
}

export interface PASessionListItem {
  id: string;
  classId: string;
  sessionDate: string;
  topic: string | null;
  isLocked: boolean;
  scores: PAScoreRow[];
}

export interface PASessionDetail extends PASessionListItem {
  class: { id: string; name: string; batch: { id: string; name: string; program: "MDC" | "CC" } };
  rubricWeights: RubricWeights;
}

export const RUBRIC_LABELS: { key: keyof RubricWeights; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "creativity", label: "Creativity" },
  { key: "execution", label: "Execution" },
  { key: "teamwork", label: "Teamwork" },
  { key: "timeManagement", label: "Time Management" },
];
