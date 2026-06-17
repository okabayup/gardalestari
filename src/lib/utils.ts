
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a member's full name including their title prefix and postfix.
 * The format is: `Prefix Name, Postfix`
 * @param name - The base name of the member.
 * @param prefix - The title prefix (e.g., "Prof. Dr.").
 * @param postfix - The title postfix (e.g., "S.T., M.Kom.").
 * @returns The fully formatted name string.
 */
export function formatFullName(name: string, prefix?: string, postfix?: string): string {
  let formattedName = name;
  if (prefix) {
    formattedName = `${prefix} ${name}`;
  }
  if (postfix) {
    formattedName = `${formattedName}, ${postfix}`;
  }
  return formattedName;
}
