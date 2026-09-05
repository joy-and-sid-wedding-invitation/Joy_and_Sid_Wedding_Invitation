/**
 * Minimal invitation creation script (no UI, no admin dashboard).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." bun scripts/create-invitation.ts "Guest Name" [--base https://your-site.com]
 *
 * Token generation: 24 random bytes from crypto.randomBytes (CSPRNG),
 * encoded base64url -> 32 URL-safe characters, ~192 bits of entropy.
 */
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

function generateToken(): string {
  return randomBytes(24).toString("base64url"); // 32 chars, 192 bits
}

async function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf("--base");
  const base =
    baseIndex >= 0 ? args[baseIndex + 1] : "https://project-creation-space.lovable.app";
  const guestName = args.filter((_, i) => i !== baseIndex && i !== baseIndex + 1).join(" ").trim();

  if (!guestName) {
    console.error('Usage: bun scripts/create-invitation.ts "Guest Name" [--base https://site]');
    process.exit(1);
  }

  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(connectionString);
  const token = generateToken();

  const rows = (await sql`
    insert into invitations (token, guest_name)
    values (${token}, ${guestName})
    returning id, token, guest_name, status
  `) as { id: string; token: string; guest_name: string; status: string }[];

  const row = rows[0]!;
  console.log(`Created invitation for ${row.guest_name} (${row.status})`);
  console.log(`${base}/invite/${row.token}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
