import { PrismaClient, Role, Program, Sex, StudentCategory } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Run with: npx prisma db seed
 *
 * Does two idempotent things (safe to re-run — each step skips if its
 * data already exists):
 *  1. Creates one Super Admin account (Supabase Auth + our `users` table)
 *  2. Creates one sample Batch + Class + Group per program (MDC, CC), all
 *     facilitated by the Super Admin for now — there's no Class/Batch
 *     management UI yet (that's a later phase), so this exists purely to
 *     give the Student Management screens something real to select from.
 *     Reassign these to real facilitator accounts once that UI exists.
 */
const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@schoolofdiscipleship.local";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super Admin already exists: ${email}`);
    return existing;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification for this seeded account
  });

  if (error || !data.user) {
    throw new Error(`Failed to create Supabase Auth user: ${error?.message}`);
  }

  const user = await prisma.user.create({
    data: {
      authId: data.user.id,
      email,
      fullName: "Super Admin",
      role: Role.SUPER_ADMIN,
    },
  });

  console.log("✅ Seeded Super Admin account:");
  console.log(`   email:    ${email}`);
  console.log(`   password: ${password}`);
  console.log("   Change this password after first login.");

  return user;
}

async function seedSampleAcademicData(facilitatorId: string) {
  for (const program of [Program.MDC, Program.CC] as const) {
    const batchName = `${program} Batch 1`;
    const existingBatch = await prisma.batch.findFirst({ where: { name: batchName, program } });
    if (existingBatch) {
      console.log(`Sample ${program} batch already exists — skipping.`);
      continue;
    }

    const batch = await prisma.batch.create({
      data: { name: batchName, program, startDate: new Date() },
    });

    const cls = await prisma.class.create({
      data: { name: `${program} Class A`, batchId: batch.id, facilitatorId },
    });

    await prisma.group.create({ data: { name: "Group 1", classId: cls.id } });

    console.log(`✅ Seeded sample ${program} batch, class, and group.`);
  }
}

async function seedSampleStudents() {
  const existingCount = await prisma.student.count();
  if (existingCount > 0) {
    console.log("Sample students already exist — skipping.");
    return;
  }

  const classes = await prisma.class.findMany({ include: { groups: true } });
  const sampleNames = ["Juan Dela Cruz", "Maria Santos", "Jose Rizal", "Ana Reyes"];

  for (const cls of classes) {
    for (let i = 0; i < sampleNames.length; i++) {
      await prisma.student.create({
        data: {
          fullName: sampleNames[i],
          sex: i % 2 === 0 ? Sex.MALE : Sex.FEMALE,
          category: StudentCategory.ADULT,
          classId: cls.id,
          groupId: cls.groups[0]?.id,
        },
      });
    }
  }

  console.log("✅ Seeded sample students.");
}

async function main() {
  const superAdmin = await seedSuperAdmin();
  await seedSampleAcademicData(superAdmin.id);
  await seedSampleStudents();
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
