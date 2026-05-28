import { prisma } from "../../utils/prisma";
import { syncAutomaticEventStatuses } from "../../utils/event-status-automation";
import { createExcelBuffer } from "../../utils/excel-export";

function getMonthRange(year, month) {
  if (!year || !month) return null;

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);

  return { start, end };
}

function parseDateOnly(value) {
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

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toISOString().slice(0, 10);
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);
  const escaped = stringValue.replaceAll('"', '""');

  return `"${escaped}"`;
}

export default defineEventHandler(async (event) => {
  await syncAutomaticEventStatuses();

  const query = getQuery(event);

  const search = query.search?.toString().trim() || "";
  const status = query.status?.toString() || "";
  const serviceTypeId = query.serviceTypeId?.toString() || "";
  const year = query.year ? Number(query.year) : null;
  const month = query.month ? Number(query.month) : null;
  const dateFrom = parseDateOnly(query.dateFrom);
  const dateTo = parseDateOnly(query.dateTo || query.dateFrom);

  const where = {};

  if (search) {
    where.OR = [
      { eventName: { contains: search, mode: "insensitive" } },
      { clientName: { contains: search, mode: "insensitive" } },
      { clientPhone: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { equipmentSetup: { contains: search, mode: "insensitive" } },
      { vendorSewa: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (serviceTypeId) {
    where.serviceTypeId = serviceTypeId;
  }

  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) where.eventDate.gte = dateFrom;
    if (dateTo) where.eventDate.lt = addDays(dateTo, 1);
  } else {
    const monthRange = getMonthRange(year, month);

    if (monthRange) {
      where.eventDate = {
        gte: monthRange.start,
        lt: monthRange.end,
      };
    }
  }

  if (where.eventDate && Object.keys(where.eventDate).length === 0) {
    delete where.eventDate;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      serviceType: true,
      sales: true,
      assignments: {
        where: {
          assignmentStatus: {
            in: ["ASSIGNED", "CONFIRMED"],
          },
        },
        include: {
          staff: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      eventDate: "desc",
    },
  });

  const headers = [
    "Event Name",
    "Client Name",
    "Client Phone",
    "Service Type",
    "Equipment Setup",
    "Sales",
    "Petugas",
    "Event Date",
    "Start Time",
    "End Time",
    "Loading Date",
    "Loading Time",
    "Location",
    "Status",
    "Vehicle Name",
    "Driver Name",
    "Vendor Sewa",
    "Ribbon Awal",
    "Ribbon Akhir",
    "Total Penggunaan",
    "Notes",
  ];

  const rows = events.map((eventData) => {
    const petugas = eventData.assignments
      .map((assignment) => {
        return `${assignment.staff?.name || "-"} (${assignment.roleInEvent})`;
      })
      .join(", ");

    return [
      eventData.eventName,
      eventData.clientName,
      eventData.clientPhone,
      eventData.serviceType?.name,
      eventData.equipmentSetup,
      eventData.sales?.name,
      petugas,
      formatDate(eventData.eventDate),
      eventData.startTime,
      eventData.endTime,
      formatDate(eventData.loadingDate),
      eventData.loadingTime,
      eventData.location,
      eventData.status,
      eventData.vehicleName,
      eventData.driverName,
      eventData.vendorSewa,
      eventData.ribbonStart,
      eventData.ribbonEnd,
      eventData.ribbonUsed,
      eventData.notes,
    ];
  });

  if (query.format?.toString().toLowerCase() === "xlsx") {
    const buffer = await createExcelBuffer({
      sheetName: "Events",
      headers,
      rows,
    });

    setHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    setHeader(
      event,
      "Content-Disposition",
      'attachment; filename="event-list-export.xlsx"',
    );

    return buffer;
  }

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    'attachment; filename="event-list-export.csv"',
  );

  return csv;
});
