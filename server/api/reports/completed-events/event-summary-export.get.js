import { prisma } from "../../../utils/prisma";

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return { start, end };
}

function formatDate(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toISOString().slice(0, 10);
}

function formatBoolean(value) {
  if (value === true) return "OK";
  if (value === false) return "NOT OK";
  return "";
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);
  const escaped = stringValue.replaceAll('"', '""');

  return `"${escaped}"`;
}

function getEventSuccessStatus(eventData) {
  const activeAssignments = eventData.assignments || [];
  const staffEvaluations = eventData.staffEvaluations || [];

  if (!eventData.eventEvaluation) {
    return "NOT EVALUATED";
  }

  if (activeAssignments.length === 0) {
    return "NO ACTIVE STAFF";
  }

  const evaluatedStaffIds = staffEvaluations.map((evaluation) => {
    return evaluation.staffId;
  });

  const allStaffEvaluated = activeAssignments.every((assignment) => {
    return evaluatedStaffIds.includes(assignment.staffId);
  });

  if (!allStaffEvaluated) {
    return "NOT FULLY EVALUATED";
  }

  const allSuccess = activeAssignments.every((assignment) => {
    const staffEvaluation = staffEvaluations.find((evaluation) => {
      return evaluation.staffId === assignment.staffId;
    });

    return staffEvaluation?.isSuccess === true;
  });

  return allSuccess ? "SUCCESS" : "NOT SUCCESS";
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const now = new Date();

  const year = Number(query.year || now.getFullYear());
  const month = Number(query.month || now.getMonth() + 1);

  if (!year || !month || month < 1 || month > 12) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid year or month",
    });
  }

  const { start, end } = getMonthRange(year, month);

  const events = await prisma.event.findMany({
    where: {
      status: "COMPLETED",
      eventDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      serviceType: true,
      sales: true,
      eventEvaluation: true,
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
      staffEvaluations: true,
    },
    orderBy: {
      eventDate: "asc",
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
    "Kepuasan Client",
    "Is Success",
    "Client Feedback",
    "Event Notes",
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
      formatBoolean(eventData.eventEvaluation?.clientSatisfactionOk),
      getEventSuccessStatus(eventData),
      eventData.eventEvaluation?.clientFeedback,
      eventData.notes,
    ];
  });

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="completed-events-summary-${year}-${month}.csv"`,
  );

  return csv;
});
