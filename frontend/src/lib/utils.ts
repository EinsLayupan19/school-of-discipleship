import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names (clsx) and resolves Tailwind
 * conflicts (twMerge). Used by every shadcn/ui component we add.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
