import { Sex, StudentCategory } from "@prisma/client";

export function parseSex(raw: unknown): Sex | null {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (["M", "MALE"].includes(value)) return Sex.MALE;
  if (["F", "FEMALE"].includes(value)) return Sex.FEMALE;
  return null;
}

export function parseCategory(raw: unknown): StudentCategory | null {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (value === "YOUTH") return StudentCategory.YOUTH;
  if (value === "ADULT") return StudentCategory.ADULT;
  if (value === "SENIOR") return StudentCategory.SENIOR;
  return null;
}
