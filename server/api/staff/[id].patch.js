import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  const name = body?.name?.trim();
  const phone = body?.phone?.trim() || null;
  const defaultRole = body?.defaultRole || "JUNIOR_CREW";
  const canBeAssignedToEvent = Boolean(body?.canBeAssignedToEvent);
  const status = body?.status || "ACTIVE";
  const notes = body?.notes?.trim() || null;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff id is required",
    });
  }

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff name is required",
    });
  }

  if (!["PIC", "SENIOR_CREW", "JUNIOR_CREW", "INHOUSE"].includes(defaultRole)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid staff role",
    });
  }

  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid staff status",
    });
  }

  const existingStaff = await prisma.staff.findUnique({
    where: { id },
  });

  if (!existingStaff) {
    throw createError({
      statusCode: 404,
      statusMessage: "Staff not found",
    });
  }

  const updatedStaff = await prisma.staff.update({
    where: { id },
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
    data: updatedStaff,
  };
});
