import { createFileRoute } from "@tanstack/react-router";

const title = "Private Invitation — Joy & Sid";
const description =
  "This wedding invitation is private. Please use the personal link you were sent.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

/**
 * Public root is intentionally locked. Guests must open their personal
 * /invite/<token> link — the root URL must not reveal the invitation.
 */
function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-3xl tracking-[0.06em] text-foreground">
          Private Invitation
        </p>
        <div className="mx-auto my-5 h-px w-16 bg-accent/60" />
        <p className="font-serif text-[15px] italic leading-relaxed text-muted-foreground">
          This page is not a public invitation. Please open the personal link
          we sent you to view your invitation and respond.
        </p>
        <p className="mt-6 font-script text-2xl text-accent">Joy &amp; Sid</p>
      </div>
    </div>
  );
}
