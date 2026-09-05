import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import page1 from "@/assets/v2-page1.webp";
import page2 from "@/assets/v2-page2.webp";
import page3 from "@/assets/v2-page3.webp";
import page4 from "@/assets/v2-page4.webp";
import page5 from "@/assets/v2-page5.webp";
import page6 from "@/assets/v2-page6.webp";
import page7 from "@/assets/v2-page7.webp";
import page8 from "@/assets/v2-page8.webp";
import page9 from "@/assets/v2-page9.webp";
import { CountdownSection } from "./CountdownSection";
import { EnvelopeCover } from "./EnvelopeCover";
import { RsvpDialog } from "./RsvpDialog";

function assetSrc(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

// `tone` is sampled directly from each page's own paper border, so the
// letterbox bands match the artwork exactly with no visible seam.
const pages = [
  { src: assetSrc(page1), label: "Joy & Sid", tone: "#f0e7de" },
  { src: assetSrc(page2), label: "Our story", tone: "#f2e8db" },
  { src: assetSrc(page3), label: "The date", tone: "#ede3d9" },
  { src: assetSrc(page4), label: "The weekend", tone: "#eaddcf" },
  { src: assetSrc(page5), label: "The programme", tone: "#f9efe3" },
  { src: assetSrc(page6), label: "What to wear", tone: "#f6ebdb" },
  { src: assetSrc(page7), label: "Getting there", tone: "#f4ece1" },
  { src: assetSrc(page8), label: "RSVP", tone: "#f3ebdf" },
  { src: assetSrc(page9), label: "Until then", tone: "#f2e9e0" },
];


const RSVP_INDEX = 7;



export function InvitationDeck({ token }: { token?: string }) {
  const [sealed, setSealed] = useState(true);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const sections = useRef<Array<HTMLElement | null>>([]);

  // Lock scrolling while the envelope is on screen (and drop the reserved
  // scrollbar gutter so the full-screen cover truly reaches both edges).
  useEffect(() => {
    document.body.style.overflow = sealed ? "hidden" : "";
    document.documentElement.style.scrollbarGutter = sealed ? "auto" : "";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.scrollbarGutter = "";
    };
  }, [sealed]);

  useEffect(() => {
    if (sealed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset["index"]);
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (entry.intersectionRatio > 0.5) setActive(index);
          }
        });
      },
      { threshold: [0.02, 0.5], rootMargin: "12% 0px 12% 0px" },
    );

    sections.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [sealed]);

  useEffect(() => {
    if (sealed) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sealed]);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, index));
    sections.current[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Keyboard navigation through the deck.
  useEffect(() => {
    if (sealed) return;
    const onKey = (e: KeyboardEvent) => {
      if (rsvpOpen) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goTo(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(pages.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sealed, active, rsvpOpen, goTo]);

  // One consistent warm ivory base (#F7F0E3) behind every section — the
  // breathing gaps all show the same paper, never random page tones.

  return (

    <>
      {sealed && <EnvelopeCover onOpened={() => setSealed(false)} />}

      <div
        className={sealed ? "invisible" : "deck-enter relative"}
        aria-hidden={sealed}
      >
        {/* warm ivory paper base — identical behind every section */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-ivory"
        />
        {/* ultra-subtle fine-grain matte paper texture (~6% opacity) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")",
            opacity: 0.06,
            mixBlendMode: "multiply",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 26%, oklch(1 0 0 / 10%) 0%, transparent 60%), radial-gradient(circle at 50% 100%, oklch(0.23 0.029 79 / 8%) 0%, transparent 58%)",
          }}
        />


        {/* scroll progress */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[2px] bg-transparent">
          <div
            className="h-full origin-left bg-gold transition-transform duration-150 ease-out"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        <div className="story-scroll w-full max-w-full overflow-x-clip">
          {pages.map((page, index) => (
            <Fragment key={page.src}>
              {index === RSVP_INDEX && <CountdownSection />}
            <section
              data-index={index}
              ref={(node) => {
                sections.current[index] = node;
              }}
              aria-label={page.label}
              className="story-section page-reveal"
              style={
                {
                  background: page.tone,
                } as React.CSSProperties
              }
            >
              <div className="story-page-shell relative flex max-w-full items-center justify-center">
                {/* blurred bleed of the same artwork fills the letterbox bands
                    so wide screens feel continuous instead of random colors */}
                <img
                  src={page.src}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="story-bleed"
                />
                <div className="story-page-frame relative">
                  <img
                    src={page.src}
                    alt={page.label}
                    width={1080}
                    height={1920}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="story-page"
                  />

                  {index === RSVP_INDEX && (
                    <button
                      type="button"
                      onClick={() => setRsvpOpen(true)}
                      aria-label="Open the RSVP form"
                      className="absolute z-10 left-1/2 top-[65.5%] h-[8%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-sm transition-shadow hover:shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  )}
                </div>
              </div>

            </section>
            </Fragment>
          ))}
        </div>



        {/* page rail */}
        <nav
          aria-label="Invitation pages"
          className="story-page-rail fixed right-2 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-2 sm:right-4 sm:flex"
        >
          {pages.map((page, index) => (
            <button
              key={page.label}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to ${page.label}`}
              aria-current={active === index}
              className="group flex items-center gap-2 py-1"
            >
              <span className="label-caps pointer-events-none hidden text-[0.55rem] text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block">
                {page.label}
              </span>
              <span
                className={`block h-[7px] w-[7px] rounded-full border border-accent/40 transition-all duration-300 ${
                  active === index ? "scale-150 bg-accent" : "bg-accent/20 group-hover:bg-accent/60"
                }`}
              />
            </button>
          ))}
        </nav>

        {/* persistent RSVP call to action — tucked into the corner so it never
            covers the invitation text, and hidden on the RSVP page itself
            (that page has its own tap target) */}
        <button
          type="button"
          onClick={() => setRsvpOpen(true)}
          className={`story-floating-rsvp label-caps fixed bottom-4 left-4 z-30 rounded-full border border-gold/50 bg-card/90 px-4 py-2 text-[0.55rem] text-foreground shadow-[var(--shadow-seal)] backdrop-blur-md transition-all duration-500 hover:border-gold hover:shadow-[var(--shadow-glow)] ${
            active >= 1 && active !== RSVP_INDEX
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-6 opacity-0"
          }`}
        >
          R.S.V.P.
        </button>

        {active === 0 && (
          <div className="story-scroll-hint label-caps pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 text-[0.55rem] text-muted-foreground">
            Scroll to continue
          </div>
        )}

        <RsvpDialog open={rsvpOpen} onOpenChange={setRsvpOpen} token={token} />
      </div>
    </>
  );
}
