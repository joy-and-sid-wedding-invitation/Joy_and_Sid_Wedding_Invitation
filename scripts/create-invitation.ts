/**
 * Minimal invitation creation script (no UI, no admin dashboard).
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/create-invitation.ts "Guest Name"
 *   npx tsx --env-file=.env scripts/create-invitation.ts "Guest Name" --base http://localhost:8080
 *
 * Default base is SITE_URL from .env, then the GitHub Pages production URL.
 *
 * Token generation: 24 random bytes from crypto.randomBytes (CSPRNG),
 * encoded base64url -> 32 URL-safe characters, ~192 bits of entropy.
 */
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const PRODUCTION_SITE =
  "https://joy-and-sid-wedding-invitation.github.io/Joy_and_Sid_Wedding_Invitation";

function generateToken(): string {
  return randomBytes(24).toString("base64url"); // 32 chars, 192 bits
}

function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

async function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf("--base");
  const baseFromFlag =
    baseIndex >= 0 && args[baseIndex + 1] ? args[baseIndex + 1] : undefined;
  const base = normalizeBase(
    baseFromFlag ||
      process.env["SITE_URL"] ||
      process.env["INVITE_BASE_URL"] ||
      PRODUCTION_SITE,
  );
  const guestName = args
    .filter((_, i) => baseIndex < 0 || (i !== baseIndex && i !== baseIndex + 1))
    .join(" ")
    .trim();

  if (!guestName) {
    console.error(
      'Usage: npx tsx --env-file=.env scripts/create-invitation.ts "Guest Name" [--base https://site]',
    );
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
