import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, "id");
  const body = await readBody(event);
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const staffId = body?.staffId;

  if (!staffId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff is required",
    });
  }

  const assignment = await prisma.eventAssignment.findUnique({
    where: {
      eventId_staffId: {
        eventId,
        staffId,
      },
    },
  });

  if (!assignment) {
    throw createError({
      statusCode: 400,
      statusMessage: "Staff is not assigned to this event",
    });
  }

  if (!["ASSIGNED", "CONFIRMED"].includes(assignment.assignmentStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only active assigned staff can be evaluated",
    });
  }

  const eventEvaluation = await prisma.eventEvaluation.findUnique({
    where: {
      eventId,
    },
  });

  const clientSatisfactionOk = eventEvaluation?.clientSatisfactionOk || false;

  const sopOk = Boolean(body?.sopOk);
  const warehouseOk = Boolean(body?.warehouseOk);
  const groomingOk = Boolean(body?.groomingOk);
  const dataCollectionOk = Boolean(body?.dataCollectionOk);
  const notes = body?.notes?.trim() || null;

  const isSuccess =
    sopOk &&
    warehouseOk &&
    groomingOk &&
    dataCollectionOk &&
    clientSatisfactionOk;

  const evaluation = await prisma.staffEventEvaluation.upsert({
    where: {
      eventId_staffId: {
        eventId,
        staffId,
      },
    },
    update: {
      evaluatorUserId: session.user.id,
      sopOk,
      warehouseOk,
      groomingOk,
      dataCollectionOk,
      isSuccess,
      notes,
    },
    create: {
      eventId,
      staffId,
      evaluatorUserId: session.user.id,
      sopOk,
      warehouseOk,
      groomingOk,
      dataCollectionOk,
      isSuccess,
      notes,
    },
  });

  return {
    success: true,
    data: evaluation,
  };
});