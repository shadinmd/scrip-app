import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

export const getTodayStr = () => {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
};

export const getCurrentMonthStr = () => {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM');
};

export const formatToLocalDay = (date: Date | string | number) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, 'yyyy-MM-dd');
};

export const formatDisplayDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
