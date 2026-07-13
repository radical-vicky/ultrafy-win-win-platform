/**
 * Promote an existing user to ADMIN.
 * Usage: npx tsx scripts/make-admin.ts [email protected]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts [email protected]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email "${email}". Sign up with that email first, then re-run this.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN", emailVerified: new Date(), approvalStatus: "APPROVED", approvedAt: new Date() },
  });
  console.log(`✔ ${email} is now an ADMIN. Log in at /admin/login with their existing password.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
