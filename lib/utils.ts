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