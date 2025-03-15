import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for merging tailwind classes with clsx/twMerge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 