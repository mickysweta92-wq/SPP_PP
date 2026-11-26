export interface HlProgress {
  achieved: number;
  target: number;
}

export interface MonthlyGoal {
  month: string;
  hl: number;
  status?: 'achieved' | 'missed' | 'pending';
}

export interface RewardPrice {
  original: number;
  discountPercent: number;
  discounted: number;
}

/** "25,245" -> 25245 */
export function parseNumber(text: string): number {
  const digits = text.replace(/[^\d.-]/g, '');
  if (!digits) throw new Error(`Cannot parse a number from "${text}"`);
  return Number(digits);
}

/** "15,335 HL / 9,970 HL" -> { achieved: 15335, target: 9970 } */
export function parseHlProgress(text: string): HlProgress {
  const match = text.match(/([\d,]+)\s*HL\s*\/\s*([\d,]+)\s*HL/i);
  if (!match) throw new Error(`Unexpected HL progress text: "${text}"`);
  return { achieved: parseNumber(match[1]), target: parseNumber(match[2]) };
}

/** "Jan 620 HL" -> { month: 'Jan', hl: 620 } */
export function parseMonthlyGoal(text: string): MonthlyGoal {
  const match = text.match(/([A-Za-z]{3})\s*([\d,]+)\s*HL/i);
  if (!match) throw new Error(`Unexpected monthly goal text: "${text}"`);
  return { month: match[1], hl: parseNumber(match[2]) };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Formats a date like the app does: "26 November 2026" */
export function formatLongDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
