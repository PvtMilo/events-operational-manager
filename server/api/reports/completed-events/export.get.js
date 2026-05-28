import { prisma } from "../../../utils/prisma";
import { denyStaff } from "../../../utils/permission";
import { getReportRange } from "../../../utils/report-date-range";

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

export default defineEventHandler(async (event) => {
  await denyStaff(event);

  const query = getQuery(event);
  const range = getReportRange(query);

  const events = await prisma.event.findMany({
    where: {
      status: "COMPLETED",
      eventDate: {
        gte: range.start,
        lt: range.end,
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
    "Role In Event",
    "Assignment Status",
    "Event Date",
    "Start Time",
    "End Time",
    "Loading Date",
    "Loading Time",
    "Location",
    "Status",
    "Vehicle Name",
    "Driver Name",
    "SOP",
    "Gudang",
    "Kepuasan Client",
    "Grooming",
    "Pendataan",
    "Is Success",
    "Staff Evaluation Notes",
    "Client Feedback",
    "Internal Notes",
    "Event Notes",
  ];

  const rows = [];

  for (const eventData of events) {
    for (const assignment of eventData.assignments) {
      const staffEvaluation = eventData.staffEvaluations.find((evaluation) => {
        return evaluation.staffId === assignment.staffId;
      });

      rows.push([
        eventData.eventName,
        eventData.clientName,
        eventData.clientPhone,
        eventData.serviceType?.name,
        eventData.equipmentSetup,
        eventData.sales?.name,
        assignment.staff?.name,
        assignment.roleInEvent,
        assignment.assignmentStatus,
        formatDate(eventData.eventDate),
        eventData.startTime,
        eventData.endTime,
        formatDate(eventData.loadingDate),
        eventData.loadingTime,
        eventData.location,
        eventData.status,
        eventData.vehicleName,
        eventData.driverName,
        formatBoolean(staffEvaluation?.sopOk),
        formatBoolean(staffEvaluation?.warehouseOk),
        formatBoolean(eventData.eventEvaluation?.clientSatisfactionOk),
        formatBoolean(staffEvaluation?.groomingOk),
        formatBoolean(staffEvaluation?.dataCollectionOk),
        staffEvaluation?.isSuccess ? "SUCCESS" : "NOT SUCCESS",
        staffEvaluation?.notes,
        eventData.eventEvaluation?.clientFeedback,
        eventData.eventEvaluation?.notes,
        eventData.notes,
      ]);
    }
  }

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="completed-events-${range.fileLabel}.csv"`,
  );

  return csv;
});
