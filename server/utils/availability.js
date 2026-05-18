function combineDateAndTime(dateValue, timeValue) {
  const date = new Date(dateValue);

  const dateOnly = date.toISOString().slice(0, 10);
  const time = timeValue || "00:00";

  return new Date(`${dateOnly}T${time}:00`);
}

export function getEventDutyWindow(eventData) {
  const dutyStart =
    eventData.loadingDate && eventData.loadingTime
      ? combineDateAndTime(eventData.loadingDate, eventData.loadingTime)
      : combineDateAndTime(eventData.eventDate, eventData.startTime);

  const dutyEnd = combineDateAndTime(eventData.eventDate, eventData.endTime);

  return {
    dutyStart,
    dutyEnd,
  };
}

export function isTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function isSameDate(dateA, dateB) {
  return dateA.toISOString().slice(0, 10) === dateB.toISOString().slice(0, 10);
}
