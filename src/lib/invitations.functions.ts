import { createServerFn } from "@tanstack/react-start";

import type { Invitation, InvitationStatus, RsvpDetails } from "./db.server";

export type InvitationLookup =
  | { state: "invalid" }
  | { state: "pending" | "responded"; guestName: string; status: InvitationStatus };

function clampText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function parseGuestCount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(10, Math.round(n)));
}

/** Look up one invitation by its URL token. Returns only safe fields. */
export const getInvitation = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => ({
    token: String(input.token ?? "").slice(0, 128),
  }))
  .handler(async ({ data }): Promise<InvitationLookup> => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const rows = (await sql`
      select guest_name, status
      from invitations
      where token = ${data.token}
      limit 1
    `) as Pick<Invitation, "guest_name" | "status">[];

    const row = rows[0];
    if (!row) return { state: "invalid" };
    return {
      state: row.status === "pending" ? "pending" : "responded",
      guestName: row.guest_name,
      status: row.status,
    };
  });

/**
 * One-time RSVP. The conditional UPDATE (status = 'pending') is atomic in
 * PostgreSQL, so a second submission — or two simultaneous ones — updates
 * zero rows and is rejected by the database, not the frontend.
 */
export const respondToInvitation = createServerFn({ method: "POST" })
  .inputValidator((input: {
    token: string;
    attending: boolean;
    responseName?: string;
    responseEmail?: string;
    guestCount?: number | null;
    dietary?: string;
    flightDetails?: string;
    message?: string;
  }) => ({
    token: String(input.token ?? "").slice(0, 128),
    attending: Boolean(input.attending),
    responseName: clampText(input.responseName, 120),
    responseEmail: clampText(input.responseEmail, 254),
    guestCount: parseGuestCount(input.guestCount),
    dietary: clampText(input.dietary, 500),
    flightDetails: clampText(input.flightDetails, 500),
    message: clampText(input.message, 1000),
  }))
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: "invalid" | "locked" }> => {
    const { getSql } = await import("./db.server");
    const sql = getSql();
    const status: InvitationStatus = data.attending ? "accepted" : "declined";
    const guestCount = data.attending ? (data.guestCount ?? 1) : null;
    const dietary = data.attending ? data.dietary : "";
    const flightDetails = data.attending ? data.flightDetails : "";

    const updated = (await sql`
      update invitations
      set
        status = ${status},
        responded_at = now(),
        response_name = ${data.responseName || null},
        response_email = ${data.responseEmail || null},
        guest_count = ${guestCount},
        dietary = ${dietary || null},
        flight_details = ${flightDetails || null},
        message = ${data.message || null}
      where token = ${data.token} and status = 'pending'
      returning id, guest_name, responded_at
    `) as { id: string; guest_name: string; responded_at: string }[];

    const row = updated[0];
    if (row) {
      const details: RsvpDetails = {
        responseName: data.responseName,
        responseEmail: data.responseEmail,
        guestCount,
        dietary,
        flightDetails,
        message: data.message,
      };
      // Notification only fires after the write succeeded, and never blocks
      // or rolls back the RSVP if delivery fails.
      const { sendRsvpNotification } = await import("./email.server");
      await sendRsvpNotification({
        guestName: row.guest_name,
        status,
        respondedAt: String(row.responded_at),
        token: data.token,
        details,
      });
      return { ok: true };
    }

    const exists = (await sql`
      select 1 from invitations where token = ${data.token} limit 1
    `) as unknown[];
    return { ok: false, reason: exists.length > 0 ? "locked" : "invalid" };
  });
