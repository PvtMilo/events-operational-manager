import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function today() {
  return daysFromNow(0);
}

// ─── Main Seed ──────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting seed...\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════════════════════
  const passwordHash = await bcrypt.hash("admin12345", 10);
  const staffPassword = await bcrypt.hash("staff12345", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@eventops.test" },
    update: {},
    create: {
      name: "Admin EventOps",
      email: "admin@eventops.test",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const schedulerUser = await prisma.user.upsert({
    where: { email: "scheduler@eventops.test" },
    update: {},
    create: {
      name: "Dewi Scheduler",
      email: "scheduler@eventops.test",
      passwordHash: staffPassword,
      role: "SCHEDULE_MAKER",
      status: "ACTIVE",
    },
  });

  const headOpsUser = await prisma.user.upsert({
    where: { email: "headops@eventops.test" },
    update: {},
    create: {
      name: "Fajar Head Ops",
      email: "headops@eventops.test",
      passwordHash: staffPassword,
      role: "HEAD_OPERATIONAL",
      status: "ACTIVE",
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@eventops.test" },
    update: {},
    create: {
      name: "Galih Staff",
      email: "staff@eventops.test",
      passwordHash: staffPassword,
      role: "STAFF",
      status: "ACTIVE",
    },
  });

  const inactiveUser = await prisma.user.upsert({
    where: { email: "inactive@eventops.test" },
    update: {},
    create: {
      name: "Hana (Inactive)",
      email: "inactive@eventops.test",
      passwordHash: staffPassword,
      role: "STAFF",
      status: "INACTIVE",
    },
  });

  console.log("✅ Users seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SERVICE TYPES
  // ═══════════════════════════════════════════════════════════════════════════
  const serviceTypesData = [
    {
      name: "Classic Photobooth",
      description: "Standard photobooth with physical prints",
      requiresRibbonTracking: true,
    },
    {
      name: "AI Photobooth",
      description: "AI-powered photo activation with digital filters",
      requiresRibbonTracking: false,
    },
    {
      name: "Lite Box",
      description: "Compact light box photo service",
      requiresRibbonTracking: true,
    },
    {
      name: "Karaoke Videobooth",
      description: "Karaoke video booth for parties and events",
      requiresRibbonTracking: false,
    },
    {
      name: "Registration System",
      description: "QR-based event registration and check-in system",
      requiresRibbonTracking: false,
    },
    {
      name: "Interactive Game",
      description: "Custom interactive game activation for events",
      requiresRibbonTracking: false,
    },
  ];

  const serviceTypes = {};
  for (const st of serviceTypesData) {
    const result = await prisma.serviceType.upsert({
      where: { name: st.name },
      update: {
        description: st.description,
        requiresRibbonTracking: st.requiresRibbonTracking,
      },
      create: st,
    });
    serviceTypes[st.name] = result;
  }

  console.log("✅ Service types seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. STAFF
  // ═══════════════════════════════════════════════════════════════════════════
  const staffData = [
    {
      name: "Andi Pratama",
      phone: "081111111111",
      defaultRole: "PIC",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Lead PIC, experienced in corporate events",
      birthDate: new Date("1995-03-15"),
    },
    {
      name: "Budi Santoso",
      phone: "082222222222",
      defaultRole: "SENIOR_CREW",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Senior crew, expert with Classic Photobooth setup",
      birthDate: new Date("1997-07-22"),
    },
    {
      name: "Citra Dewi",
      phone: "083333333333",
      defaultRole: "JUNIOR_CREW",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Junior crew, fast learner",
      birthDate: new Date("2000-11-05"),
    },
    {
      name: "Doni Wijaya",
      phone: "084444444444",
      defaultRole: "INHOUSE",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Inhouse staff, handles warehouse & prep",
      birthDate: new Date("1998-01-30"),
    },
    {
      name: "Eka Rahayu",
      phone: "085000000001",
      defaultRole: "PIC",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Second PIC, specializes in weddings",
      birthDate: new Date("1996-06-18"),
    },
    {
      name: "Farhan Maulana",
      phone: "085000000002",
      defaultRole: "SENIOR_CREW",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Senior crew, good with AI Photobooth",
      birthDate: new Date("1999-09-10"),
    },
    {
      name: "Gita Puspita",
      phone: "085000000003",
      defaultRole: "JUNIOR_CREW",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Junior crew, training period",
      birthDate: new Date("2001-02-14"),
    },
    {
      name: "Hendra Kusuma",
      phone: "085000000004",
      defaultRole: "SENIOR_CREW",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Veteran crew, handles Karaoke Videobooth",
      birthDate: new Date("1994-12-25"),
    },
    {
      name: "Indah Permata",
      phone: "085000000005",
      defaultRole: "JUNIOR_CREW",
      canBeAssignedToEvent: false,
      status: "INACTIVE",
      notes: "On leave, unavailable",
      birthDate: new Date("2000-04-08"),
    },
    {
      name: "Joko Susilo",
      phone: "085000000006",
      defaultRole: "INHOUSE",
      canBeAssignedToEvent: true,
      status: "ACTIVE",
      notes: "Inhouse driver & loader",
      birthDate: new Date("1993-08-20"),
    },
  ];

  // Delete existing staff to avoid duplicates on re-seed
  // (createMany skipDuplicates won't work well since there's no unique constraint on name)
  const staffRecords = [];
  for (const s of staffData) {
    // Try to find existing by phone
    const existing = s.phone
      ? await prisma.staff.findFirst({ where: { phone: s.phone } })
      : null;
    if (existing) {
      staffRecords.push(existing);
    } else {
      const created = await prisma.staff.create({ data: s });
      staffRecords.push(created);
    }
  }

  console.log("✅ Staff seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SALES
  // ═══════════════════════════════════════════════════════════════════════════
  const salesData = [
    {
      name: "Samuel Hartono",
      phone: "085555555555",
      status: "ACTIVE",
      notes: "Top performer, corporate clients",
      birthDate: new Date("1992-05-12"),
    },
    {
      name: "Rina Anggraini",
      phone: "086666666666",
      status: "ACTIVE",
      notes: "Wedding & private event specialist",
      birthDate: new Date("1994-09-03"),
    },
    {
      name: "Taufik Ibrahim",
      phone: "087777777777",
      status: "ACTIVE",
      notes: "New sales, campus & community events",
      birthDate: new Date("1998-11-21"),
    },
    {
      name: "Lina Maharani",
      phone: "088888888888",
      status: "INACTIVE",
      notes: "Former sales, resigned",
      birthDate: new Date("1995-02-28"),
    },
  ];

  const salesRecords = [];
  for (const s of salesData) {
    const existing = s.phone
      ? await prisma.sales.findFirst({ where: { phone: s.phone } })
      : null;
    if (existing) {
      salesRecords.push(existing);
    } else {
      const created = await prisma.sales.create({ data: s });
      salesRecords.push(created);
    }
  }

  console.log("✅ Sales seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. STAFF AVAILABILITY BLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  const availabilityData = [
    {
      staffId: staffRecords[2].id, // Citra
      type: "CUTI",
      status: "ACTIVE",
      startDate: daysFromNow(3),
      endDate: daysFromNow(5),
      isFullDay: true,
      reason: "Liburan keluarga",
      notes: "Sudah disetujui Head Ops",
    },
    {
      staffId: staffRecords[6].id, // Gita
      type: "SAKIT",
      status: "ACTIVE",
      startDate: daysFromNow(-1),
      endDate: daysFromNow(1),
      isFullDay: true,
      reason: "Demam & flu",
      notes: "Surat dokter sudah dikirim",
    },
    {
      staffId: staffRecords[3].id, // Doni
      type: "IZIN",
      status: "ACTIVE",
      startDate: daysFromNow(7),
      endDate: daysFromNow(7),
      isFullDay: false,
      startTime: "08:00",
      endTime: "12:00",
      reason: "Urusan keluarga pagi hari",
    },
    {
      staffId: staffRecords[7].id, // Hendra
      type: "LIBUR",
      status: "ACTIVE",
      startDate: daysFromNow(14),
      endDate: daysFromNow(16),
      isFullDay: true,
      reason: "Libur panjang",
    },
    {
      staffId: staffRecords[1].id, // Budi
      type: "BLOCKED",
      status: "CANCELLED",
      startDate: daysFromNow(-5),
      endDate: daysFromNow(-3),
      isFullDay: true,
      reason: "Event pribadi — dibatalkan",
      notes: "Budi cancel sendiri",
    },
  ];

  for (const a of availabilityData) {
    await prisma.staffAvailabilityBlock.create({ data: a });
  }

  console.log("✅ Staff availability blocks seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EVENTS (across various statuses & dates for rich dashboard display)
  // ═══════════════════════════════════════════════════════════════════════════
  const eventsData = [
    // ── COMPLETED events (past) ───────────────────────────────────────────
    {
      eventName: "Wedding Reception Ayu & Reza",
      clientName: "Ayu Lestari",
      clientPhone: "081200001111",
      serviceTypeId: serviceTypes["Classic Photobooth"].id,
      equipmentSetup: "2 unit booth, backdrop pink",
      salesId: salesRecords[1].id,
      eventDate: daysFromNow(-14),
      startTime: "10:00",
      endTime: "22:00",
      loadingDate: daysFromNow(-15),
      loadingTime: "14:00",
      location: "Hotel Mulia, Jakarta",
      status: "COMPLETED",
      loadingStatus: "LOADED",
      vehicleName: "Toyota HiAce Putih",
      driverName: "Pak Joko",
      ribbonStart: 1,
      ribbonEnd: 300,
      ribbonUsed: 287,
      notes: "Event berjalan lancar",
    },
    {
      eventName: "Product Launch XYZ Corp",
      clientName: "PT XYZ Corporation",
      clientPhone: "021555000111",
      serviceTypeId: serviceTypes["AI Photobooth"].id,
      equipmentSetup: "1 unit AI booth + LED backdrop",
      salesId: salesRecords[0].id,
      eventDate: daysFromNow(-7),
      startTime: "13:00",
      endTime: "17:00",
      loadingDate: daysFromNow(-8),
      loadingTime: "09:00",
      location: "ICE BSD, Tangerang",
      status: "COMPLETED",
      loadingStatus: "LOADED",
      vehicleName: "Mitsubishi L300",
      driverName: "Pak Joko",
      notes: "Corporate event, sukses",
    },
    {
      eventName: "Birthday Party Keisha",
      clientName: "Mama Keisha",
      clientPhone: "081300002222",
      serviceTypeId: serviceTypes["Lite Box"].id,
      equipmentSetup: "1 unit lite box",
      salesId: salesRecords[1].id,
      eventDate: daysFromNow(-10),
      startTime: "15:00",
      endTime: "20:00",
      loadingDate: daysFromNow(-10),
      loadingTime: "10:00",
      location: "Rumah klien, Kemang",
      status: "COMPLETED",
      loadingStatus: "LOADED",
      vehicleName: "Avanza Silver",
      driverName: "Doni",
      ribbonStart: 301,
      ribbonEnd: 450,
      ribbonUsed: 132,
    },

    // ── PENDING_EVALUATION events (past, need evaluation) ────────────────
    {
      eventName: "Gala Dinner Charity Foundation",
      clientName: "Yayasan Peduli Bangsa",
      clientPhone: "021600003333",
      serviceTypeId: serviceTypes["Classic Photobooth"].id,
      equipmentSetup: "3 unit booth, gold theme",
      salesId: salesRecords[0].id,
      eventDate: daysFromNow(-3),
      startTime: "18:00",
      endTime: "23:00",
      loadingDate: daysFromNow(-4),
      loadingTime: "10:00",
      location: "Ritz Carlton Pacific Place, Jakarta",
      status: "PENDING_EVALUATION",
      loadingStatus: "LOADED",
      vehicleName: "Toyota HiAce Putih",
      driverName: "Pak Joko",
      ribbonStart: 451,
      ribbonEnd: 900,
      ribbonUsed: 423,
      notes: "Event besar, perlu evaluasi lengkap",
    },
    {
      eventName: "Campus Festival UI",
      clientName: "BEM UI",
      clientPhone: "081400004444",
      serviceTypeId: serviceTypes["Karaoke Videobooth"].id,
      equipmentSetup: "2 unit karaoke booth",
      salesId: salesRecords[2].id,
      eventDate: daysFromNow(-2),
      startTime: "09:00",
      endTime: "21:00",
      loadingDate: daysFromNow(-3),
      loadingTime: "16:00",
      location: "Balairung UI, Depok",
      status: "PENDING_EVALUATION",
      loadingStatus: "LOADED",
      vehicleName: "Mitsubishi L300",
      driverName: "Doni",
      notes: "Perlu evaluasi crew performance",
    },

    // ── ONGOING event (today) ─────────────────────────────────────────────
    {
      eventName: "Wedding Expo 2026",
      clientName: "PT Pameran Indonesia",
      clientPhone: "021700005555",
      serviceTypeId: serviceTypes["AI Photobooth"].id,
      equipmentSetup: "4 unit AI booth + green screen",
      salesId: salesRecords[0].id,
      eventDate: today(),
      startTime: "10:00",
      endTime: "20:00",
      loadingDate: daysFromNow(-1),
      loadingTime: "18:00",
      location: "JCC Senayan, Jakarta",
      status: "ONGOING",
      loadingStatus: "LOADED",
      vehicleName: "Toyota HiAce Putih",
      driverName: "Pak Joko",
      notes: "Event hari ini, 3 hari (booth tetap)",
    },
    {
      eventName: "Corporate Gathering Bank ABC",
      clientName: "Bank ABC",
      clientPhone: "021800006666",
      serviceTypeId: serviceTypes["Classic Photobooth"].id,
      equipmentSetup: "2 unit booth standar",
      salesId: salesRecords[0].id,
      eventDate: today(),
      startTime: "14:00",
      endTime: "18:00",
      loadingDate: today(),
      loadingTime: "08:00",
      location: "Ballroom Hotel Indonesia Kempinski",
      status: "ONGOING",
      loadingStatus: "LOADED",
      vehicleName: "Avanza Silver",
      driverName: "Doni",
      ribbonStart: 901,
      ribbonEnd: 1100,
      notes: "Loading pagi ini, sudah selesai",
    },

    // ── READY events (upcoming, fully prepared) ──────────────────────────
    {
      eventName: "Sweet 17 Amanda",
      clientName: "Pak Hendrik (Papa Amanda)",
      clientPhone: "081500007777",
      serviceTypeId: serviceTypes["Lite Box"].id,
      equipmentSetup: "1 unit lite box + ring light",
      salesId: salesRecords[1].id,
      eventDate: daysFromNow(2),
      startTime: "16:00",
      endTime: "21:00",
      loadingDate: daysFromNow(1),
      loadingTime: "10:00",
      location: "The Springs Club, Summarecon",
      status: "READY",
      loadingStatus: "PREPARING",
      vehicleName: "Avanza Silver",
      driverName: "Joko",
      ribbonStart: 1101,
      ribbonEnd: 1250,
      notes: "Crew sudah di-assign, loading besok",
    },
    {
      eventName: "Exhibition Booth TechFest",
      clientName: "PT Teknologi Maju",
      clientPhone: "021900008888",
      serviceTypeId: serviceTypes["Interactive Game"].id,
      equipmentSetup: "2 unit game station + monitor 55 inch",
      salesId: salesRecords[0].id,
      eventDate: daysFromNow(3),
      startTime: "09:00",
      endTime: "18:00",
      loadingDate: daysFromNow(2),
      loadingTime: "15:00",
      location: "Jakarta Convention Center Hall A",
      status: "READY",
      loadingStatus: "NOT_PREPARED",
      vehicleName: "Toyota HiAce Putih",
      driverName: "Pak Joko",
      notes: "Perlu loading H-1",
    },

    // ── SCHEDULED events (upcoming, need prep/assignment) ────────────────
    {
      eventName: "Wedding Nisa & Arif",
      clientName: "Keluarga Besar Arif",
      clientPhone: "081600009999",
      serviceTypeId: serviceTypes["Classic Photobooth"].id,
      equipmentSetup: "2 unit booth, rustic theme",
      salesId: salesRecords[1].id,
      eventDate: daysFromNow(5),
      startTime: "08:00",
      endTime: "16:00",
      loadingDate: daysFromNow(4),
      loadingTime: "14:00",
      location: "Gedung Serbaguna Balai Kartini",
      status: "SCHEDULED",
      loadingStatus: "NOT_PREPARED",
      notes: "Belum assign crew",
    },
    {
      eventName: "Company Anniversary PT Mega",
      clientName: "PT Mega Sejahtera",
      clientPhone: "021100010101",
      serviceTypeId: serviceTypes["Karaoke Videobooth"].id,
      equipmentSetup: "3 unit karaoke booth",
      salesId: salesRecords[0].id,
      eventDate: daysFromNow(7),
      startTime: "17:00",
      endTime: "22:00",
      loadingDate: daysFromNow(6),
      loadingTime: "09:00",
      location: "Djakarta Theater, Thamrin",
      status: "SCHEDULED",
      loadingStatus: "NOT_PREPARED",
      vehicleName: "Mitsubishi L300",
      notes: "Belum assign crew, waiting confirmation kendaraan",
    },
    {
      eventName: "Registration System Seminar Nasional",
      clientName: "Kemenparekraf",
      clientPhone: "021200020202",
      serviceTypeId: serviceTypes["Registration System"].id,
      equipmentSetup: "5 unit tablet + printer badge",
      salesId: salesRecords[2].id,
      eventDate: daysFromNow(10),
      startTime: "07:00",
      endTime: "17:00",
      location: "JIEXPO Kemayoran",
      status: "SCHEDULED",
      loadingStatus: "NOT_PREPARED",
      notes: "Loading date belum ditentukan — perlu attention di dashboard",
    },
    {
      eventName: "AI Photobooth Music Festival",
      clientName: "Soundwave Entertainment",
      clientPhone: "081700030303",
      serviceTypeId: serviceTypes["AI Photobooth"].id,
      equipmentSetup: "6 unit AI booth outdoor",
      salesId: salesRecords[0].id,
      eventDate: daysFromNow(14),
      startTime: "14:00",
      endTime: "23:00",
      loadingDate: daysFromNow(13),
      loadingTime: "06:00",
      location: "GBK Senayan, Jakarta",
      status: "SCHEDULED",
      loadingStatus: "NOT_PREPARED",
      notes: "Event besar, butuh 6 crew minimum",
    },

    // ── DRAFTED events (planning stage) ──────────────────────────────────
    {
      eventName: "Private Party Mr. Tanaka",
      clientName: "Mr. Hiroshi Tanaka",
      clientPhone: "081800040404",
      serviceTypeId: serviceTypes["Classic Photobooth"].id,
      equipmentSetup: "Not specified",
      salesId: salesRecords[0].id,
      eventDate: daysFromNow(21),
      startTime: "19:00",
      endTime: "23:00",
      location: "Private Villa, Puncak",
      status: "DRAFTED",
      loadingStatus: "NOT_PREPARED",
      notes: "Masih negosiasi harga, draft only",
    },
    {
      eventName: "School Graduation SMA 1",
      clientName: "OSIS SMA Negeri 1",
      clientPhone: "081900050505",
      serviceTypeId: serviceTypes["Lite Box"].id,
      equipmentSetup: "2 unit lite box",
      eventDate: daysFromNow(30),
      startTime: "08:00",
      endTime: "14:00",
      location: "Aula SMA Negeri 1, Jakarta Pusat",
      status: "DRAFTED",
      loadingStatus: "NOT_PREPARED",
      notes: "Belum ada sales yang handle, draft dari inquiry",
    },

    // ── CANCELLED event ──────────────────────────────────────────────────
    {
      eventName: "Year End Party PT Omega (BATAL)",
      clientName: "PT Omega International",
      clientPhone: "021300060606",
      serviceTypeId: serviceTypes["Karaoke Videobooth"].id,
      equipmentSetup: "2 unit karaoke booth",
      salesId: salesRecords[0].id,
      eventDate: daysFromNow(8),
      startTime: "18:00",
      endTime: "23:00",
      location: "Fairmont Hotel, Jakarta",
      status: "CANCELLED",
      loadingStatus: "NOT_PREPARED",
      notes: "Dibatalkan oleh klien karena perubahan budget",
    },

    // ── Events with loading TODAY (for dashboard loading reminders) ──────
    {
      eventName: "Corporate Training Telkom",
      clientName: "Telkom Indonesia",
      clientPhone: "021400070707",
      serviceTypeId: serviceTypes["Registration System"].id,
      equipmentSetup: "3 unit tablet registration",
      salesId: salesRecords[2].id,
      eventDate: daysFromNow(1),
      startTime: "08:00",
      endTime: "17:00",
      loadingDate: today(),
      loadingTime: "15:00",
      location: "Telkom Landmark Tower, Gatot Subroto",
      status: "SCHEDULED",
      loadingStatus: "PREPARING",
      vehicleName: "Avanza Silver",
      driverName: "Doni",
      notes: "Loading hari ini jam 3 sore!",
    },

    // ── Event with loading TOMORROW ──────────────────────────────────────
    {
      eventName: "Engagement Party Sari & Dimas",
      clientName: "Keluarga Sari",
      clientPhone: "081200080808",
      serviceTypeId: serviceTypes["Classic Photobooth"].id,
      equipmentSetup: "1 unit booth classic mini",
      salesId: salesRecords[1].id,
      eventDate: daysFromNow(3),
      startTime: "11:00",
      endTime: "15:00",
      loadingDate: daysFromNow(1),
      loadingTime: "08:00",
      location: "Restoran Seribu Rasa, Menteng",
      status: "SCHEDULED",
      loadingStatus: "NOT_PREPARED",
      vehicleName: "Avanza Silver",
      driverName: "Joko",
      ribbonStart: 1251,
      ribbonEnd: 1400,
      notes: "Loading besok pagi jam 8",
    },
  ];

  const eventRecords = [];
  for (const e of eventsData) {
    const created = await prisma.event.create({ data: e });
    eventRecords.push(created);
  }

  console.log("✅ Events seeded (" + eventRecords.length + " events)");

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EVENT ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const assignmentsData = [
    // Wedding Reception Ayu & Reza (COMPLETED) — full crew
    { eventIdx: 0, staffIdx: 0, roleInEvent: "PIC", assignmentStatus: "CONFIRMED" },
    { eventIdx: 0, staffIdx: 1, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },
    { eventIdx: 0, staffIdx: 2, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },

    // Product Launch XYZ (COMPLETED)
    { eventIdx: 1, staffIdx: 4, roleInEvent: "PIC", assignmentStatus: "CONFIRMED" },
    { eventIdx: 1, staffIdx: 5, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },

    // Birthday Party Keisha (COMPLETED)
    { eventIdx: 2, staffIdx: 0, roleInEvent: "PIC", assignmentStatus: "CONFIRMED" },
    { eventIdx: 2, staffIdx: 6, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },

    // Gala Dinner Charity (PENDING_EVALUATION)
    { eventIdx: 3, staffIdx: 0, roleInEvent: "PIC", assignmentStatus: "CONFIRMED" },
    { eventIdx: 3, staffIdx: 1, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },
    { eventIdx: 3, staffIdx: 2, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },
    { eventIdx: 3, staffIdx: 5, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },

    // Campus Festival UI (PENDING_EVALUATION)
    { eventIdx: 4, staffIdx: 4, roleInEvent: "PIC", assignmentStatus: "CONFIRMED" },
    { eventIdx: 4, staffIdx: 7, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },
    { eventIdx: 4, staffIdx: 3, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },

    // Wedding Expo 2026 (ONGOING — today)
    { eventIdx: 5, staffIdx: 0, roleInEvent: "PIC", assignmentStatus: "CONFIRMED" },
    { eventIdx: 5, staffIdx: 1, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },
    { eventIdx: 5, staffIdx: 5, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },
    { eventIdx: 5, staffIdx: 7, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },

    // Corporate Gathering Bank ABC (ONGOING — today)
    { eventIdx: 6, staffIdx: 4, roleInEvent: "PIC", assignmentStatus: "CONFIRMED" },
    { eventIdx: 6, staffIdx: 2, roleInEvent: "CREW", assignmentStatus: "CONFIRMED" },

    // Sweet 17 Amanda (READY)
    { eventIdx: 7, staffIdx: 0, roleInEvent: "PIC", assignmentStatus: "ASSIGNED" },
    { eventIdx: 7, staffIdx: 6, roleInEvent: "CREW", assignmentStatus: "ASSIGNED" },

    // Exhibition Booth TechFest (READY)
    { eventIdx: 8, staffIdx: 4, roleInEvent: "PIC", assignmentStatus: "ASSIGNED" },
    { eventIdx: 8, staffIdx: 1, roleInEvent: "CREW", assignmentStatus: "ASSIGNED" },
    { eventIdx: 8, staffIdx: 3, roleInEvent: "CREW", assignmentStatus: "ASSIGNED" },

    // Corporate Training Telkom (SCHEDULED, loading today)
    { eventIdx: 16, staffIdx: 5, roleInEvent: "PIC", assignmentStatus: "ASSIGNED" },
    { eventIdx: 16, staffIdx: 3, roleInEvent: "CREW", assignmentStatus: "ASSIGNED" },

    // Engagement Party Sari & Dimas (SCHEDULED, loading tomorrow)
    { eventIdx: 17, staffIdx: 0, roleInEvent: "PIC", assignmentStatus: "ASSIGNED" },

    // Cancelled event — had assignment that got cancelled
    { eventIdx: 15, staffIdx: 7, roleInEvent: "PIC", assignmentStatus: "CANCELLED", notes: "Event dibatalkan" },
    { eventIdx: 15, staffIdx: 2, roleInEvent: "CREW", assignmentStatus: "CANCELLED", notes: "Event dibatalkan" },
  ];

  for (const a of assignmentsData) {
    const eventId = eventRecords[a.eventIdx].id;
    const staffId = staffRecords[a.staffIdx].id;

    // Check if already exists
    const existing = await prisma.eventAssignment.findUnique({
      where: { eventId_staffId: { eventId, staffId } },
    });

    if (!existing) {
      await prisma.eventAssignment.create({
        data: {
          eventId,
          staffId,
          roleInEvent: a.roleInEvent,
          assignmentStatus: a.assignmentStatus,
          notes: a.notes || null,
        },
      });
    }
  }

  console.log("✅ Event assignments seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. EVENT EVALUATIONS (for COMPLETED events)
  // ═══════════════════════════════════════════════════════════════════════════
  const evaluationsData = [
    {
      eventIdx: 0, // Wedding Reception Ayu & Reza
      evaluatorUserId: headOpsUser.id,
      clientSatisfactionOk: true,
      clientFeedback: "Klien sangat puas, foto cetaknya bagus semua. Minta contact untuk event lanjutan.",
      notes: "Event sukses besar. Semua crew perform baik.",
    },
    {
      eventIdx: 1, // Product Launch XYZ
      evaluatorUserId: headOpsUser.id,
      clientSatisfactionOk: true,
      clientFeedback: "AI filter sesuai brand guideline. Client happy.",
      notes: "Booth ramai pengunjung dari awal sampai akhir.",
    },
    {
      eventIdx: 2, // Birthday Party Keisha
      evaluatorUserId: adminUser.id,
      clientSatisfactionOk: true,
      clientFeedback: "Anak-anak senang, mama Keisha bilang recommended!",
      notes: "Event kecil tapi lancar.",
    },
  ];

  for (const ev of evaluationsData) {
    const eventId = eventRecords[ev.eventIdx].id;

    const existing = await prisma.eventEvaluation.findUnique({
      where: { eventId },
    });

    if (!existing) {
      await prisma.eventEvaluation.create({
        data: {
          eventId,
          evaluatorUserId: ev.evaluatorUserId,
          clientSatisfactionOk: ev.clientSatisfactionOk,
          clientFeedback: ev.clientFeedback,
          notes: ev.notes,
        },
      });
    }
  }

  console.log("✅ Event evaluations seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. STAFF EVENT EVALUATIONS (for COMPLETED events)
  // ═══════════════════════════════════════════════════════════════════════════
  const staffEvalsData = [
    // Wedding Reception — all crew evaluated
    {
      eventIdx: 0,
      staffIdx: 0,
      evaluatorUserId: headOpsUser.id,
      sopOk: true, warehouseOk: true, groomingOk: true, dataCollectionOk: true, isSuccess: true,
      notes: "PIC sangat baik, komunikasi dengan klien excellent",
    },
    {
      eventIdx: 0,
      staffIdx: 1,
      evaluatorUserId: headOpsUser.id,
      sopOk: true, warehouseOk: true, groomingOk: true, dataCollectionOk: true, isSuccess: true,
      notes: "Setup cepat dan rapi",
    },
    {
      eventIdx: 0,
      staffIdx: 2,
      evaluatorUserId: headOpsUser.id,
      sopOk: true, warehouseOk: false, groomingOk: true, dataCollectionOk: true, isSuccess: true,
      notes: "Perlu improvement di pengemasan barang saat bongkar",
    },

    // Product Launch — crew evaluated
    {
      eventIdx: 1,
      staffIdx: 4,
      evaluatorUserId: headOpsUser.id,
      sopOk: true, warehouseOk: true, groomingOk: true, dataCollectionOk: true, isSuccess: true,
      notes: "PIC mantap handle corporate client",
    },
    {
      eventIdx: 1,
      staffIdx: 5,
      evaluatorUserId: headOpsUser.id,
      sopOk: true, warehouseOk: true, groomingOk: false, dataCollectionOk: true, isSuccess: true,
      notes: "Grooming kurang rapi untuk corporate event, remind next time",
    },

    // Birthday Party Keisha
    {
      eventIdx: 2,
      staffIdx: 0,
      evaluatorUserId: adminUser.id,
      sopOk: true, warehouseOk: true, groomingOk: true, dataCollectionOk: true, isSuccess: true,
      notes: "Good job as always",
    },
    {
      eventIdx: 2,
      staffIdx: 6,
      evaluatorUserId: adminUser.id,
      sopOk: true, warehouseOk: true, groomingOk: true, dataCollectionOk: false, isSuccess: true,
      notes: "Lupa collect data tamu di akhir event. Perlu diingatkan.",
    },
  ];

  for (const se of staffEvalsData) {
    const eventId = eventRecords[se.eventIdx].id;
    const staffId = staffRecords[se.staffIdx].id;

    const existing = await prisma.staffEventEvaluation.findUnique({
      where: { eventId_staffId: { eventId, staffId } },
    });

    if (!existing) {
      await prisma.staffEventEvaluation.create({
        data: {
          eventId,
          staffId,
          evaluatorUserId: se.evaluatorUserId,
          sopOk: se.sopOk,
          warehouseOk: se.warehouseOk,
          groomingOk: se.groomingOk,
          dataCollectionOk: se.dataCollectionOk,
          isSuccess: se.isSuccess,
          notes: se.notes,
        },
      });
    }
  }

  console.log("✅ Staff event evaluations seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. EVENT ACTIVITY LOGS
  // ═══════════════════════════════════════════════════════════════════════════
  const activityLogsData = [
    // Wedding Reception Ayu & Reza
    { eventIdx: 0, userId: adminUser.id, action: "EVENT_CREATED", description: "Event dibuat dari inquiry sales Rina" },
    { eventIdx: 0, userId: schedulerUser.id, action: "STATUS_CHANGED", description: "Status → SCHEDULED", metadata: { from: "DRAFTED", to: "SCHEDULED" } },
    { eventIdx: 0, userId: schedulerUser.id, action: "CREW_ASSIGNED", description: "Andi ditambahkan sebagai PIC" },
    { eventIdx: 0, userId: schedulerUser.id, action: "CREW_ASSIGNED", description: "Budi & Citra ditambahkan sebagai crew" },
    { eventIdx: 0, userId: headOpsUser.id, action: "STATUS_CHANGED", description: "Status → READY", metadata: { from: "SCHEDULED", to: "READY" } },
    { eventIdx: 0, userId: headOpsUser.id, action: "LOADING_STATUS_CHANGED", description: "Loading status → LOADED", metadata: { from: "NOT_PREPARED", to: "LOADED" } },
    { eventIdx: 0, userId: headOpsUser.id, action: "STATUS_CHANGED", description: "Status → COMPLETED", metadata: { from: "ONGOING", to: "COMPLETED" } },
    { eventIdx: 0, userId: headOpsUser.id, action: "EVALUATION_SUBMITTED", description: "Evaluasi event & crew selesai" },

    // Product Launch XYZ
    { eventIdx: 1, userId: adminUser.id, action: "EVENT_CREATED", description: "Event corporate dari Samuel" },
    { eventIdx: 1, userId: schedulerUser.id, action: "CREW_ASSIGNED", description: "Eka sebagai PIC, Farhan sebagai crew" },
    { eventIdx: 1, userId: headOpsUser.id, action: "STATUS_CHANGED", description: "Status → COMPLETED" },

    // Wedding Expo 2026 (ONGOING)
    { eventIdx: 5, userId: adminUser.id, action: "EVENT_CREATED", description: "Event expo besar, 3 hari" },
    { eventIdx: 5, userId: schedulerUser.id, action: "CREW_ASSIGNED", description: "Full team assigned: Andi (PIC), Budi, Farhan, Hendra" },
    { eventIdx: 5, userId: headOpsUser.id, action: "STATUS_CHANGED", description: "Status → ONGOING", metadata: { from: "READY", to: "ONGOING" } },

    // Corporate Gathering Bank ABC (ONGOING)
    { eventIdx: 6, userId: adminUser.id, action: "EVENT_CREATED", description: "Event corporate Bank ABC" },
    { eventIdx: 6, userId: schedulerUser.id, action: "CREW_ASSIGNED", description: "Eka (PIC), Citra (crew)" },
    { eventIdx: 6, userId: headOpsUser.id, action: "LOADING_STATUS_CHANGED", description: "Loading selesai pagi ini" },

    // Wedding Nisa & Arif (SCHEDULED, no crew yet)
    { eventIdx: 9, userId: adminUser.id, action: "EVENT_CREATED", description: "Event wedding dari inquiry Rina" },
    { eventIdx: 9, userId: schedulerUser.id, action: "STATUS_CHANGED", description: "Status → SCHEDULED", metadata: { from: "DRAFTED", to: "SCHEDULED" } },

    // Cancelled event
    { eventIdx: 15, userId: adminUser.id, action: "EVENT_CREATED", description: "Event year end party" },
    { eventIdx: 15, userId: adminUser.id, action: "STATUS_CHANGED", description: "Status → CANCELLED karena budget cut", metadata: { from: "SCHEDULED", to: "CANCELLED" } },
  ];

  for (const log of activityLogsData) {
    await prisma.eventActivityLog.create({
      data: {
        eventId: eventRecords[log.eventIdx].id,
        userId: log.userId,
        action: log.action,
        description: log.description,
        metadata: log.metadata || undefined,
      },
    });
  }

  console.log("✅ Event activity logs seeded");

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Seed completed successfully!");
  console.log("═".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`   Users:                 5 (1 admin, 1 scheduler, 1 head ops, 1 staff, 1 inactive)`);
  console.log(`   Service Types:         ${Object.keys(serviceTypes).length}`);
  console.log(`   Staff:                 ${staffRecords.length}`);
  console.log(`   Sales:                 ${salesRecords.length}`);
  console.log(`   Availability Blocks:   ${availabilityData.length}`);
  console.log(`   Events:                ${eventRecords.length}`);
  console.log(`   Event Assignments:     ${assignmentsData.length}`);
  console.log(`   Event Evaluations:     ${evaluationsData.length}`);
  console.log(`   Staff Evaluations:     ${staffEvalsData.length}`);
  console.log(`   Activity Logs:         ${activityLogsData.length}`);
  console.log("\n🔑 Login Credentials:");
  console.log("   ┌─────────────────────────────────┬───────────────────┬─────────────────┐");
  console.log("   │ Email                           │ Password          │ Role            │");
  console.log("   ├─────────────────────────────────┼───────────────────┼─────────────────┤");
  console.log("   │ admin@eventops.test              │ admin12345        │ ADMIN           │");
  console.log("   │ scheduler@eventops.test          │ staff12345        │ SCHEDULE_MAKER  │");
  console.log("   │ headops@eventops.test            │ staff12345        │ HEAD_OPERATIONAL│");
  console.log("   │ staff@eventops.test              │ staff12345        │ STAFF           │");
  console.log("   │ inactive@eventops.test           │ staff12345        │ STAFF (INACTIVE)│");
  console.log("   └─────────────────────────────────┴───────────────────┴─────────────────┘");
  console.log("\n📅 Events by Status:");
  console.log("   COMPLETED:           3  (with evaluations)");
  console.log("   PENDING_EVALUATION:  2  (need evaluation)");
  console.log("   ONGOING:             2  (running today)");
  console.log("   READY:               2  (crew assigned, loading soon)");
  console.log("   SCHEDULED:           5  (some need crew, some need loading date)");
  console.log("   DRAFTED:             2  (planning stage)");
  console.log("   CANCELLED:           1");
  console.log("\n🔔 Dashboard will show:");
  console.log("   - Loading Today:      events with loadingDate = today");
  console.log("   - Upcoming Loading:   events with loadingDate = tomorrow/H+2");
  console.log("   - Need Attention:     events without loadingDate (Seminar Nasional)");
  console.log("   - Today Events:       2 ongoing events");
  console.log("   - Pending Evaluation: 2 events awaiting evaluation");
  console.log("   - Need Assignment:    SCHEDULED events without active crew");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });