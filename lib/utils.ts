import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { format } from "date-fns"

export const formatDateLong = (date: Date | string) => {
  return format(new Date(date), "PPP")
}

export const formatDateShort = (date: Date | string) => {
  return format(new Date(date), "PP")
}

export const getOrdinalSuffix = (day: number) => {
  if (day <= 0 || day > 31) {
    throw new Error("Payment day is invalid")
  }

  const lookup: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
    21: "21st",
    22: "22nd",
    23: "23rd",
    31: "31st",
  }

  return lookup[day] || `${day}th`
}