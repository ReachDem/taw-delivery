/**
 * Create a Super Admin user using Better-Auth's native API
 * Usage: npx tsx scripts/create-superadmin.ts
 */
import "dotenv/config";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

async function createSuperAdmin() {
    const email = "latioms@gmail.com";
    const password = "@Difficile21";
    const name = "Super Admin";

    console.log(`🚀 Creating Super Admin: ${email}`);

    // 1. Sign up via Better-Auth API
    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": BASE_URL,
        },
        body: JSON.stringify({ email, password, name }),
    });

    if (!signUpRes.ok) {
        const err = await signUpRes.json().catch(() => ({}));
        // User might already exist — that's fine, we'll update the role
        if (err?.code === "USER_ALREADY_EXISTS" || signUpRes.status === 422) {
            console.log("⏭️  User already exists, will update role to SUPER_ADMIN");
        } else {
            console.error("❌ Sign-up failed:", err);
            process.exit(1);
        }
    } else {
        console.log("✅ User created via Better-Auth");
    }

    // 2. Update role to SUPER_ADMIN using Prisma (Better-Auth doesn't expose role update via API)
    const { PrismaNeon } = await import("@prisma/adapter-neon");
    const { PrismaClient } = await import("../lib/generated/prisma/client.js");

    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    const prisma = new PrismaClient({ adapter });

    await prisma.user.update({
        where: { email },
        data: { role: "SUPER_ADMIN" },
    });

    console.log("✅ Role set to SUPER_ADMIN");

    await prisma.$disconnect();
    console.log("🎉 Done! You can log in at /admin/login");
}

createSuperAdmin().catch((e) => {
    console.error("💥 Fatal:", e);
    process.exit(1);
});
