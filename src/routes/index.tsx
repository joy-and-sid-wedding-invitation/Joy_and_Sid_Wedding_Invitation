import { createFileRoute } from "@tanstack/react-router";

import { InvitationDeck } from "@/components/InvitationDeck";

const title = "Joy & Sid — A Weekend in Chiang Mai, 9 January 2027";
const description =
  "The wedding invitation of Joy & Sid. Join us in Chiang Mai, Thailand on Saturday 9 January 2027 — schedule, dress code, travel and RSVP.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <h1 className="sr-only">
        Joy &amp; Sid — Wedding Invitation, Chiang Mai, 9 January 2027
      </h1>
      <InvitationDeck />
    </main>
  );
}
