const formatterCache = new Map();

const formatterFor = (timeZone) => {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }));
  }
  return formatterCache.get(timeZone);
};

const getLocalParts = (instant, timeZone) => Object.fromEntries(
  formatterFor(timeZone).formatToParts(instant)
    .filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, Number(value)])
);

const isDateKey = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const dateKeyAt = (instant, timeZone) => {
  const { year, month, day } = getLocalParts(new Date(instant), timeZone);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const localMidnightUtc = (dateKey, timeZone) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day);
  let candidate = localAsUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = getLocalParts(new Date(candidate), timeZone);
    const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const offset = representedAsUtc - Math.floor(candidate / 1000) * 1000;
    const next = localAsUtc - offset;
    if (next === candidate) break;
    candidate = next;
  }

  return new Date(candidate);
};

const getDayBounds = (dateKey, timeZone) => {
  if (!isDateKey(dateKey)) throw new TypeError('date must be a valid YYYY-MM-DD calendar date');
  const start = localMidnightUtc(dateKey, timeZone);
  const nextCalendarDay = new Date(`${dateKey}T00:00:00.000Z`);
  nextCalendarDay.setUTCDate(nextCalendarDay.getUTCDate() + 1);
  const nextDateKey = nextCalendarDay.toISOString().slice(0, 10);
  const nextStart = localMidnightUtc(nextDateKey, timeZone);
  return { start, end: new Date(nextStart.getTime() - 1) };
};

module.exports = { dateKeyAt, getDayBounds, isDateKey };