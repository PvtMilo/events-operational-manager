import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin12345", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@eventops.test",
    },
    update: {},
    create: {
      name: "Admin EventOps",
      email: "admin@eventops.test",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.serviceType.upsert({
    where: { name: "Classic Photobooth" },
    update: {},
    create: {
      name: "Classic Photobooth",
      description: "Standard photobooth service",
    },
  });

  await prisma.serviceType.upsert({
    where: { name: "AI Photobooth" },
    update: {},
    create: {
      name: "AI Photobooth",
      description: "AI photo activation service",
    },
  });

  await prisma.serviceType.upsert({
    where: { name: "Lite Box" },
    update: {},
    create: {
      name: "Lite Box",
      description: "Lite box photo service",
    },
  });

  await prisma.serviceType.upsert({
    where: { name: "Karaoke Videobooth" },
    update: {},
    create: {
      name: "Karaoke Videobooth",
      description: "Karaoke video booth event service",
    },
  });

  await prisma.serviceType.upsert({
    where: { name: "Registration System" },
    update: {},
    create: {
      name: "Registration System",
      description: "QR-based event registration system",
    },
  });

  await prisma.serviceType.upsert({
    where: { name: "Interactive Game" },
    update: {},
    create: {
      name: "Interactive Game",
      description: "Custom interactive event game activation",
    },
  });

  await prisma.staff.createMany({
    data: [
      {
        name: "Andi",
        phone: "081111111111",
        defaultRole: "PIC",
        canBeAssignedToEvent: true,
        status: "ACTIVE",
        notes: "Sample PIC",
      },
      {
        name: "Budi",
        phone: "082222222222",
        defaultRole: "SENIOR_CREW",
        canBeAssignedToEvent: true,
        status: "ACTIVE",
        notes: "Sample senior crew",
      },
      {
        name: "Citra",
        phone: "083333333333",
        defaultRole: "JUNIOR_CREW",
        canBeAssignedToEvent: true,
        status: "ACTIVE",
        notes: "Sample junior crew",
      },
      {
        name: "Doni",
        phone: "084444444444",
        defaultRole: "INHOUSE",
        canBeAssignedToEvent: true,
        status: "ACTIVE",
        notes: "Sample inhouse backup",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.sales.createMany({
    data: [
      {
        name: "Samuel",
        phone: "085555555555",
        status: "ACTIVE",
        notes: "Sample sales",
      },
      {
        name: "Rina",
        phone: "086666666666",
        status: "ACTIVE",
        notes: "Sample sales",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed.");
  console.log("Admin login:");
  console.log("Email: admin@eventops.test");
  console.log("Password: admin12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });