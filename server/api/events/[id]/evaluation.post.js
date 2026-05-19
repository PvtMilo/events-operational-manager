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

  const clientSatisfactionOk = Boolean(body?.clientSatisfactionOk);
  const clientFeedback = body?.clientFeedback?.trim() || null;
  const notes = body?.notes?.trim() || null;

  const eventData = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!eventData) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found",
    });
  }

  const evaluation = await prisma.eventEvaluation.upsert({
    where: {
      eventId,
    },
    update: {
      clientSatisfactionOk,
      clientFeedback,
      notes,
      evaluatorUserId: session.user.id,
    },
    create: {
      eventId,
      evaluatorUserId: session.user.id,
      clientSatisfactionOk,
      clientFeedback,
      notes,
    },
  });

  const staffEvaluations = await prisma.staffEventEvaluation.findMany({
    where: {
      eventId,
    },
  });

  for (const staffEvaluation of staffEvaluations) {
    const isSuccess =
      staffEvaluation.sopOk &&
      staffEvaluation.warehouseOk &&
      staffEvaluation.groomingOk &&
      staffEvaluation.dataCollectionOk &&
      clientSatisfactionOk;

    await prisma.staffEventEvaluation.update({
      where: {
        id: staffEvaluation.id,
      },
      data: {
        isSuccess,
      },
    });
  }

  return {
    success: true,
    data: evaluation,
  };
});