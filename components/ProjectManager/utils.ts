
export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  // Use UTC to avoid timezone/DST shifts affecting the date
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

export const getDaysDiff = (start: string, end: string): number => {
  // Parse as UTC midnights
  const d1 = new Date(start);
  const d2 = new Date(end);
  // Reset time portion explicitly to avoid any offsets (though parsing YYYY-MM-DD usually does this in UTC)
  d1.setUTCHours(0, 0, 0, 0);
  d2.setUTCHours(0, 0, 0, 0);
  
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

export const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
