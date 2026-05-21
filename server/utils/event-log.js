import { prisma } from "./prisma";

export async function createEventLog(event, options) {
  const session = await getUserSession(event);

  const { eventId, action, description = null, metadata = null } = options;

  if (!eventId || !action) return null;

  return await prisma.eventActivityLog.create({
    data: {
      eventId,
      userId: session?.user?.id || null,
      action,
      description,
      metadata,
    },
  });
}
