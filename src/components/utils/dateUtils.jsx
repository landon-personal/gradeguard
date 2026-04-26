/**
 * Parse a YYYY-MM-DD date string as LOCAL midnight (not UTC).
 * Using new Date("YYYY-MM-DD") parses as UTC and causes off-by-one errors for US timezones.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}