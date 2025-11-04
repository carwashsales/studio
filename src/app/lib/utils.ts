import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getSalesPeriod() {
  const now = new Date();
  const currentHour = now.getHours();

  let start: Date;
  let end: Date;

  if (currentHour < 3) {
    // It's between midnight and 3 AM, so we're in the *previous* day's sales cycle.
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    start = new Date(yesterday);
    start.setHours(7, 0, 0, 0);

    end = new Date(now);
    end.setHours(3, 0, 0, 0);

  } else {
    // It's after 3 AM.
    // If it's before 7 AM, we still show the previous day's cycle which ended at 3 AM.
    // If it's after 7 AM, we start the new day's cycle.
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (currentHour < 7) {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        start = new Date(yesterday);
        start.setHours(7, 0, 0, 0);

        end = new Date(today);
        end.setHours(3, 0, 0, 0);
    } else {
        start = new Date(today);
        start.setHours(7, 0, 0, 0);

        end = new Date(tomorrow);
        end.setHours(3, 0, 0, 0);
    }
  }

  return { start, end };
}
