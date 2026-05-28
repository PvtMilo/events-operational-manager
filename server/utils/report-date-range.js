export function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return { start, end };
}

export function parseDateOnly(value) {
  const match = value?.toString().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function formatDateLocal(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getReportRange(query) {
  const now = new Date();
  const rawDateFrom = query.dateFrom?.toString() || "";
  const rawDateTo = query.dateTo?.toString() || rawDateFrom;

  if (rawDateFrom || rawDateTo) {
    const dateFrom = parseDateOnly(rawDateFrom);
    const dateTo = parseDateOnly(rawDateTo);

    if ((rawDateFrom && !dateFrom) || (rawDateTo && !dateTo)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid date range",
      });
    }

    const start = dateFrom || dateTo;
    const inclusiveEnd = dateTo || dateFrom;

    if (start > inclusiveEnd) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid date range",
      });
    }

    return {
      start,
      end: addDays(inclusiveEnd, 1),
      dateFrom: start,
      dateTo: inclusiveEnd,
      fileLabel: `${formatDateLocal(start)}-to-${formatDateLocal(inclusiveEnd)}`,
    };
  }

  const year = Number(query.year || now.getFullYear());
  const month = Number(query.month || now.getMonth() + 1);

  if (!year || !month || month < 1 || month > 12) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid year or month",
    });
  }

  const { start, end } = getMonthRange(year, month);
  const dateTo = addDays(end, -1);

  return {
    start,
    end,
    dateFrom: start,
    dateTo,
    fileLabel: `${formatDateLocal(start)}-to-${formatDateLocal(dateTo)}`,
    year,
    month,
  };
}
