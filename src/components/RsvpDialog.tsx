import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { respondToInvitation } from "@/lib/invitations.functions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when opened from a personalized /invite/$token link. */
  token?: string | undefined;
};

const fieldClass =
  "w-full rounded-sm border border-border/70 bg-card/60 px-3 py-2 font-serif text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent";

const labelClass =
  "block text-[11px] uppercase tracking-[0.2em] text-muted-foreground";

export function RsvpDialog({ open, onOpenChange, token }: Props) {
  const [attending, setAttending] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const respond = useServerFn(respondToInvitation);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (attending === null) {
      toast.error("Please let us know if you can join us.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      toast.error("Please share your name.");
      return;
    }
    const email = String(form.get("email") ?? "").trim();
    const guestCountRaw = form.get("guest_count");
    const guestCount =
      attending && guestCountRaw != null && String(guestCountRaw).trim() !== ""
        ? Number(guestCountRaw)
        : null;

    setSubmitting(true);

    // Personalized link: the invitation status in Neon is the source of truth,
    // and the database rejects any second response for the same token.
    const result = await respond({
      data: {
        token,
        attending,
        responseName: name,
        responseEmail: email,
        guestCount,
        dietary: String(form.get("dietary") ?? "").trim(),
        flightDetails: String(form.get("flight_details") ?? "").trim(),
        message: String(form.get("message") ?? "").trim(),
      },
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(
        result.reason === "locked"
          ? "This invitation has already been responded to."
          : "This invitation link is not valid.",
      );
      return;
    }
    setDone(true);
  }


  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      window.setTimeout(() => {
        setDone(false);
        setAttending(null);
      }, 250);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-border bg-background sm:max-w-lg">
        {!token ? (
          <div className="py-10 text-center">
            <p className="font-display text-3xl tracking-[0.06em] text-foreground">
              R.S.V.P.
            </p>
            <div className="mx-auto my-5 h-px w-16 bg-accent/60" />
            <p className="font-serif text-[15px] italic leading-relaxed text-muted-foreground">
              A personal invitation link is required to respond. Please open the
              invitation link we sent you.
            </p>
            <p className="mt-6 font-script text-2xl text-accent">Joy &amp; Sid</p>
          </div>
        ) : done ? (

          <div className="py-10 text-center">
            <p className="font-display text-3xl tracking-[0.06em] text-foreground">
              Thank you
            </p>
            <div className="mx-auto my-5 h-px w-16 bg-accent/60" />
            <p className="font-serif text-[15px] italic leading-relaxed text-muted-foreground">
              {attending
                ? "We can't wait to celebrate with you in Chiang Mai."
                : "You will be dearly missed — thank you for letting us know."}
            </p>
            <p className="mt-6 font-script text-2xl text-accent">Joy &amp; Sid</p>
          </div>
        ) : (
          <>
            <DialogHeader className="items-center text-center">
              <DialogTitle className="font-display text-3xl font-normal tracking-[0.08em] text-foreground">
                R.S.V.P.
              </DialogTitle>
              <DialogDescription className="font-serif italic text-muted-foreground">
                Kindly respond by 1 September 2026
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="rsvp-name">
                  Full name
                </label>
                <input id="rsvp-name" name="name" required className={fieldClass} />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="rsvp-email">
                  Email
                </label>
                <input
                  id="rsvp-email"
                  name="email"
                  type="email"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-2">
                <span className={labelClass}>Will you join us?</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttending(true)}
                    className={`rounded-sm border px-3 py-2.5 font-serif text-sm tracking-[0.12em] uppercase transition-colors ${
                      attending === true
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-accent"
                    }`}
                  >
                    Joyfully accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending(false)}
                    className={`rounded-sm border px-3 py-2.5 font-serif text-sm tracking-[0.12em] uppercase transition-colors ${
                      attending === false
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-accent"
                    }`}
                  >
                    Regretfully decline
                  </button>
                </div>
              </div>

              {attending === true && (
                <>
                  <div className="space-y-1.5">
                    <label className={labelClass} htmlFor="rsvp-guests">
                      Number of guests (including you)
                    </label>
                    <input
                      id="rsvp-guests"
                      name="guest_count"
                      type="number"
                      min={1}
                      max={10}
                      defaultValue={1}
                      className={fieldClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass} htmlFor="rsvp-dietary">
                      Dietary requirements
                    </label>
                    <input id="rsvp-dietary" name="dietary" className={fieldClass} />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass} htmlFor="rsvp-flight">
                      Flight details (for airport pickup)
                    </label>
                    <input
                      id="rsvp-flight"
                      name="flight_details"
                      placeholder="Flight number, arrival date &amp; time"
                      className={fieldClass}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="rsvp-message">
                  A note for Joy &amp; Sid
                </label>
                <textarea
                  id="rsvp-message"
                  name="message"
                  rows={3}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-sm bg-primary px-6 py-3 font-serif text-sm uppercase tracking-[0.28em] text-primary-foreground shadow-[var(--shadow-seal)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send response"}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
