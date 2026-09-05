/**
 * Server-only RSVP notification email via Resend.
 * The API key is read inside the function so it never reaches the browser
 * bundle, and every failure is swallowed + logged: email delivery must never
 * affect whether an RSVP counts as saved.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { RsvpDetails } from "./db.server";

/**
 * Read project `.env` first (wins over stale shell/system process.env).
 * Vite/dotenv will not override variables already present in the parent
 * environment — that is why RSVP kept going to wheelfixer69 after .env edits.
 */
function readDotEnvFile(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const path = resolve(process.cwd(), ".env");
    if (!existsSync(path)) return out;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) out[key] = value;
    }
  } catch {
    // ignore filesystem errors
  }
  return out;
}

function env(name: string): string | undefined {
  const fromFile = readDotEnvFile()[name]?.trim();
  if (fromFile) return fromFile;
  return process.env[name]?.trim() || undefined;
}

export async function sendRsvpNotification(params: {
  guestName: string;
  status: "accepted" | "declined";
  respondedAt: string;
  token: string;
  details: RsvpDetails;
}): Promise<void> {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey || apiKey === "re_xxxxxxxxx") {
    console.error(
      "RSVP email skipped: set RESEND_API_KEY in .env to your real Resend key (replace re_xxxxxxxxx)",
    );
    return;
  }

  const from = env("RSVP_EMAIL_FROM") ?? "onboarding@resend.dev";
  // With onboarding@resend.dev, Resend only delivers to the account owner's
  // address. Set RSVP_EMAIL_TO to that address for testing, or verify a domain
  // and change RSVP_EMAIL_FROM to send to anyone.
  const to = env("RSVP_EMAIL_TO") ?? "joyyandsidd@gmail.com";
  const { subject, text, html } = buildEmail(params);

  console.log(
    `RSVP email attempting from=${from} to=${to} subject="${subject}" key=${apiKey.slice(0, 8)}…`,
  );

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });
    if (error) {
      console.error("RSVP email failed:", error);
      return;
    }
    console.log(`RSVP email sent to ${to} (id: ${data?.id ?? "unknown"})`);
  } catch (error) {
    console.error("RSVP email failed", error);
  }
}

function buildEmail(params: {
  guestName: string;
  status: "accepted" | "declined";
  respondedAt: string;
  token: string;
  details: RsvpDetails;
}): { subject: string; text: string; html: string } {
  const invitee = params.guestName.trim() || "Guest";
  const when = formatRespondedAt(params.respondedAt);
  const accepted = params.status === "accepted";

  if (!accepted) {
    const subject = `${invitee} declined the invitation`;
    const text = [
      `${invitee} has declined the wedding invitation.`,
      "",
      `Invitee     : ${invitee}`,
      `Response    : Declined`,
      `Responded   : ${when}`,
      params.details.responseName
        ? `Submitted as: ${params.details.responseName}`
        : null,
      params.details.message ? `Note        : ${params.details.message}` : null,
      `Token       : ${params.token}`,
    ]
      .filter(Boolean)
      .join("\n");

    const html = wrapEmail({
      eyebrow: "RSVP · Declined",
      headline: `${escapeHtml(invitee)} declined`,
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#4a4035;">
          <strong style="color:#2c241c;">${escapeHtml(invitee)}</strong>
          has regretfully declined the invitation to Joy &amp; Sid&rsquo;s wedding.
        </p>
        ${detailTable([
          ["Invitee", invitee],
          ["Response", "Declined"],
          ["Responded", when],
          ...(params.details.responseName
            ? ([["Submitted as", params.details.responseName]] as [string, string][])
            : []),
          ...(params.details.message
            ? ([["Note", params.details.message]] as [string, string][])
            : []),
        ])}
      `,
    });

    return { subject, text, html };
  }

  const d = params.details;
  const subject = `${invitee} accepted the invitation`;
  const text = [
    `${invitee} has accepted the wedding invitation.`,
    "",
    `Invitee        : ${invitee}`,
    `Response       : Accepted`,
    `Responded      : ${when}`,
    `Name on form   : ${d.responseName || "—"}`,
    `Email          : ${d.responseEmail || "—"}`,
    `Guest count    : ${d.guestCount ?? "—"}`,
    `Dietary        : ${d.dietary || "—"}`,
    `Flight details : ${d.flightDetails || "—"}`,
    `Note           : ${d.message || "—"}`,
    `Token          : ${params.token}`,
  ].join("\n");

  const html = wrapEmail({
    eyebrow: "RSVP · Accepted",
    headline: `${escapeHtml(invitee)} accepted`,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#4a4035;">
        <strong style="color:#2c241c;">${escapeHtml(invitee)}</strong>
        has joyfully accepted the invitation to Joy &amp; Sid&rsquo;s wedding.
      </p>
      ${detailTable([
        ["Invitee", invitee],
        ["Response", "Accepted"],
        ["Responded", when],
        ["Name on form", d.responseName || "—"],
        ["Email", d.responseEmail || "—"],
        ["Guest count", d.guestCount != null ? String(d.guestCount) : "—"],
        ["Dietary requirements", d.dietary || "—"],
        ["Flight details", d.flightDetails || "—"],
        ["Note for Joy & Sid", d.message || "—"],
      ])}
    `,
  });

  return { subject, text, html };
}

function wrapEmail(opts: {
  eyebrow: string;
  headline: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.eyebrow}</title>
</head>
<body style="margin:0;padding:0;background:#f4efe6;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf7f0;border:1px solid #e4d8c6;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#8a7355;">
                ${escapeHtml(opts.eyebrow)}
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:normal;letter-spacing:0.06em;color:#2c241c;">
                ${opts.headline}
              </h1>
              <div style="margin:18px auto 0;width:56px;height:1px;background:linear-gradient(90deg,#c9a66b,#e8d5a8,#c9a66b);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;text-align:center;">
              <p style="margin:0;font-size:18px;font-style:italic;color:#a67c52;">Joy &amp; Sid</p>
              <p style="margin:8px 0 0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8a7355;">
                Chiang Mai · 9 January 2027
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailTable(rows: Array<[string, string]>): string {
  const body = rows
    .map(
      ([label, value], index) => `
      <tr>
        <td style="padding:10px 0;border-top:${index === 0 ? "1px solid #e4d8c6" : "none"};border-bottom:1px solid #e4d8c6;width:38%;vertical-align:top;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a7355;">
          ${escapeHtml(label)}
        </td>
        <td style="padding:10px 0 10px 16px;border-top:${index === 0 ? "1px solid #e4d8c6" : "none"};border-bottom:1px solid #e4d8c6;vertical-align:top;font-size:15px;line-height:1.5;color:#2c241c;">
          ${escapeHtml(value).replaceAll("\n", "<br />")}
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">${body}</table>`;
}

function formatRespondedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
