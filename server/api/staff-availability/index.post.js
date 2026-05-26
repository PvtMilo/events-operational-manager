import { prisma } from "../../utils/prisma";

const allowedRoles = ["DEVELOPER", "ADMIN", "SCHEDULE_MAKER", "HEAD_OPERATIONAL"];

const allowedTypes = ["LIBUR", "IZIN", "SAKIT", "CUTI", "BLOCKED"];

function requireAccess(session) {
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }
}

function toDateOnly(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeText(value) {
  return value?.toString().trim() || null;
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  requireAccess(session);

  const body = await readBody(event);

  const staffId = body?.staffId?.toString() || "";
  const type = body?.type?.toString() || "";
  const startDate = toDateOnly(body?.startDate);
  const endDate = toDateOnly(body?.endDate);
  const isFullDay = body?.isFullDay !== false;
  const startTime = normalizeText(body?.startTime);
  const endTime = normalizeText(body?.endTime);

  if (!staffId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff is required",
    });
  }

  if (!allowedTypes.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid availability type",
    });
  }

  if (!startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start date and end date are required",
    });
  }

  if (endDate < startDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "End date cannot be before start date",
    });
  }

  if (!isFullDay) {
    if (!startTime || !endTime) {
      throw createError({
        statusCode: 400,
        statusMessage: "Start time and end time are required for partial day",
      });
    }

    if (startDate.toISOString() !== endDate.toISOString()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Partial day block must use the same start and end date",
      });
    }

    if (endTime <= startTime) {
      throw createError({
        statusCode: 400,
        statusMessage: "End time must be after start time",
      });
    }
  }

  const staff = await prisma.staff.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staff) {
    throw createError({
      statusCode: 404,
      statusMessage: "Staff not found",
    });
  }

  const overlappingBlock = await prisma.staffAvailabilityBlock.findFirst({
    where: {
      staffId,
      status: "ACTIVE",
      startDate: {
        lte: endDate,
      },
      endDate: {
        gte: startDate,
      },
    },
  });

  if (overlappingBlock) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff already has active availability block in this date range",
    });
  }

  const block = await prisma.staffAvailabilityBlock.create({
    data: {
      staffId,
      type,
      startDate,
      endDate,
      isFullDay,
      startTime: isFullDay ? null : startTime,
      endTime: isFullDay ? null : endTime,
      reason: normalizeText(body?.reason),
      notes: normalizeText(body?.notes),
    },
    include: {
      staff: true,
    },
  });

  return {
    success: true,
    message: "Staff availability block created successfully",
    data: block,
  };
});