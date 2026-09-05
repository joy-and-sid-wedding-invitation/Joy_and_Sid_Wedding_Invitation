import { neon } from "@neondatabase/serverless";

/**
 * Server-only Neon PostgreSQL access.
 * DATABASE_URL is read inside the function (never at module scope) so the
 * value is resolved per request on the edge runtime, and never bundled
 * into the browser.
 */
export function getSql() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(connectionString);
}

export type InvitationStatus = "pending" | "accepted" | "declined";

export type Invitation = {
  id: string;
  token: string;
  guest_name: string;
  status: InvitationStatus;
  responded_at: string | null;
  response_name: string | null;
  response_email: string | null;
  guest_count: number | null;
  dietary: string | null;
  flight_details: string | null;
  message: string | null;
  created_at: string;
};

export type RsvpDetails = {
  responseName: string;
  responseEmail: string;
  guestCount: number | null;
  dietary: string;
  flightDetails: string;
  message: string;
};
