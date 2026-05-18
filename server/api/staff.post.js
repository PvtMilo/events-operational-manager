import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const name = body?.name?.trim();
  const phone = body?.phone?.trim() || null;
  const defaultRole = body?.defaultRole || "JUNIOR_CREW";
  const canBeAssignedToEvent = Boolean(body?.canBeAssignedToEvent);
  const status = body?.status || "ACTIVE";
  const notes = body?.notes?.trim() || null;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff name is required",
    });
  }

  const staff = await prisma.staff.create({
    data: {
      name,
      phone,
      defaultRole,
      canBeAssignedToEvent,
      status,
      notes,
    },
  });

  return {
    success: true,
    data: staff,
  };
});