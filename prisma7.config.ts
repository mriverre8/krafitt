import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env by itself; loadEnvFile is built into node and saves a dotenv dependency.
// loadEnvFile never overwrites what is already set, so .env.local goes first and wins, like in Next.
for (const file of [".env.local", ".env"]) {
  try {
    loadEnvFile(file);
  } catch {}
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrations need the direct connection (port 5432), not the pooler.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
});
