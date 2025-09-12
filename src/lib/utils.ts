import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a member's full name including their title prefix and postfix.
 * @param name - The base name of the member.
 * @param prefix - The title prefix (e.g., "Prof. Dr.").
 * @param postfix - The title postfix (e.g., "S.T., M.Kom.").
 * @returns The fully formatted name string.
 */
export function formatFullName(name: string, prefix?: string, postfix?: string): string {
  const parts = [];
  if (prefix) parts.push(prefix);
  parts.push(name);
  if (postfix) parts.push(postfix);
  return parts.join(' ');
}
