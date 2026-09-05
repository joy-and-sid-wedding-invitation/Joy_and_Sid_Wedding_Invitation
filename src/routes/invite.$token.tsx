import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { InvitationDeck } from "@/components/InvitationDeck";
import { getInvitation } from "@/lib/invitations.functions";

const title = "Your Invitation — Joy & Sid, Chiang Mai, 9 January 2027";
const description =
  "Your personal invitation to the wedding of Joy & Sid in Chiang Mai, Thailand on Saturday 9 January 2027.";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitePage,
});

function Message({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-3xl tracking-[0.06em] text-foreground">{heading}</p>
        <div className="mx-auto my-5 h-px w-16 bg-accent/60" />
        <p className="font-serif text-[15px] italic leading-relaxed text-muted-foreground">
          {body}
        </p>
        <p className="mt-6 font-script text-2xl text-accent">Joy &amp; Sid</p>
      </div>
    </div>
  );
}

function InvitePage() {
  const { token } = Route.useParams();
  const fetchInvitation = useServerFn(getInvitation);
  const { data, isPending, isError } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => fetchInvitation({ data: { token } }),
    retry: false,
  });

  if (isPending) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  if (isError || !data || data.state === "invalid") {
    return (
      <Message
        heading="Invitation Not Found"
        body="This invitation link is not valid. Please check the link you were sent, or reach out to us directly."
      />
    );
  }

  if (data.state === "responded") {
    return (
      <Message
        heading="Invitation Already Responded"
        body={
          data.status === "accepted"
            ? `Thank you, ${data.guestName}. Your response has been received and we can't wait to celebrate with you.`
            : `Thank you for letting us know, ${data.guestName}. You will be dearly missed.`
        }
      />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <h1 className="sr-only">
        Joy &amp; Sid — Wedding Invitation for {data.guestName}
      </h1>
      <InvitationDeck token={token} />
    </main>
  );
}
