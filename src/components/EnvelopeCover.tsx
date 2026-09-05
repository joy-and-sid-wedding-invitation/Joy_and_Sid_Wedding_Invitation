import { useEffect, useRef, useState } from "react";
import envelopeCleanUrl from "@/assets/envelope-clean.webp";
import envelopeCleanWideUrl from "@/assets/envelope-clean-wide.webp";
import sealImageUrl from "@/assets/wax-seal.webp";

function assetSrc(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

const envelopeClean = assetSrc(envelopeCleanUrl);
const envelopeCleanWide = assetSrc(envelopeCleanWideUrl);
const sealImage = assetSrc(sealImageUrl);

type Phase = "idle" | "unseal" | "flap" | "letter" | "expand";

export function EnvelopeCover({ onOpened }: { onOpened: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [entered, setEntered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 80);
    return () => {
      window.clearTimeout(id);
      timers.current.forEach(window.clearTimeout);
    };
  }, []);

  const advance = (next: Phase, delay = 0) => {
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === next ? p : next)), delay));
  };

  const handleOpen = () => {
    if (phase !== "idle") return;
    setTilt({ x: 0, y: 0 });
    setPhase("unseal");
    advance("flap", 950);
    advance("letter", 2150);
    advance("expand", 3500);
    timers.current.push(window.setTimeout(onOpened, 4600));
  };


  const finishOpen = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    onOpened();
  };

  const opening = phase !== "idle";
  const flapOpen = phase === "flap" || phase === "letter" || phase === "expand";
  const letterOut = phase === "letter" || phase === "expand";
  const expanding = phase === "expand";

  const EnvelopeArtwork = ({ alt = "" }: { alt?: string }) => (
    <picture>
      <source media="(orientation: landscape)" srcSet={envelopeCleanWide} />
      <img src={envelopeClean} alt={alt} className="absolute inset-0 h-full w-full object-fill" />
    </picture>
  );

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (opening) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 7, y: px * 9 });
  };

  return (
    <div
      className="envelope-responsive fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-paper-deep"
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "opacity" && expanding) {
          finishOpen();
        }
      }}
      style={{
        opacity: expanding ? 0 : 1,
        transition: "opacity 1s var(--ease-paper) 0.1s",
        pointerEvents: opening ? "none" : "auto",
      }}
    >
      <picture aria-hidden="true">
        <source media="(orientation: landscape)" srcSet={envelopeCleanWide} />
        <img
          src={envelopeClean}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-[42px]"
        />
      </picture>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, oklch(0.744 0.071 81.6 / 22%) 0%, transparent 55%), radial-gradient(circle at 50% 50%, transparent 40%, oklch(0.23 0.029 79 / 26%) 100%)",
        }}
      />

      <div
        className="relative h-[100svh] w-screen"
        style={{
          transformStyle: "preserve-3d",
          perspective: "clamp(1100px, 140vw, 2200px)",
          transform: expanding
            ? "scale(1.16) translateY(-2%)"
            : opening
              ? "scale(1)"
              : `scale(${entered ? 1 : 0.97})`,
          opacity: entered ? 1 : 0,
          transition: "transform 0.9s var(--ease-silk), opacity 0.7s ease-out",
          filter: "drop-shadow(0 32px 55px oklch(0.23 0.029 79 / 24%))",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${opening ? 0 : tilt.x}deg) rotateY(${opening ? 0 : tilt.y}deg)`,
            transition: "transform 0.8s var(--ease-silk)",
          }}
        >
          {/* envelope interior */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <EnvelopeArtwork />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.62 0.03 70 / 42%) 0%, oklch(0.78 0.026 76 / 22%) 38%, transparent 72%)",
                boxShadow: "inset 0 26px 46px -20px oklch(0.30 0.03 60 / 60%)",
              }}
            />
          </div>

          {/* the letter, pulled up out of the envelope */}
          <div
            className="absolute left-1/2 flex flex-col items-center justify-center gap-5 px-8 text-center"
            onTransitionEnd={(e) => {
              if (e.propertyName === "transform" && phase === "letter") setPhase("expand");
            }}
            style={{
              width: "88%",
              height: "72%",
              top: "var(--envelope-letter-top)",
              background:
                "linear-gradient(178deg, oklch(0.97 0.012 80) 0%, oklch(0.945 0.018 78) 100%)",
              boxShadow: "0 -14px 34px -18px oklch(0.30 0.03 60 / 55%)",
              transform: `translateX(-50%) translateY(${letterOut ? (expanding ? "-43%" : "-36%") : "0%"})`,
              transition: `transform ${expanding ? "1.2s var(--ease-silk)" : "1.6s var(--ease-draw)"}`,
              zIndex: 20,
            }}
          >
            <span className="block h-px w-16" style={{ background: "var(--gradient-foil)" }} />
            <p className="foil-text font-display text-[clamp(1.6rem,4.4vh,3rem)] tracking-[0.16em]">
              JOY
              <span className="px-2 font-serif text-[0.6em] italic tracking-normal">&amp;</span>
              SID
            </p>
            <p className="label-caps text-[0.6rem] text-muted-foreground">9 · 1 · 2027</p>
            <span className="block h-px w-16" style={{ background: "var(--gradient-foil)" }} />
          </div>

          {/* envelope body */}
          <div className="absolute inset-0" style={{ clipPath: "var(--envelope-body-clip)", zIndex: 30 }}>
            <EnvelopeArtwork alt="Ivory wedding envelope with embossed vines and a bronze JS wax seal" />
          </div>

          {/* the flap */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && e.propertyName === "transform" && phase === "flap") {
                advance("letter", 120);
              }
            }}
            style={{
              transformOrigin: "50% 0.8%",
              transform: `rotateX(${flapOpen ? 168 : 0}deg) translateZ(${flapOpen ? 2 : 0}px)`,
              transition: "transform 1.7s var(--ease-flap)",
              transformStyle: "preserve-3d",
              zIndex: 40,
            }}
          >
            <div
              className="absolute inset-0"
              style={{ clipPath: "var(--envelope-flap-clip)", backfaceVisibility: "hidden" }}
            >
              <EnvelopeArtwork />
            </div>
            <div
              className="absolute inset-0"
              style={{
                clipPath: "var(--envelope-flap-clip)",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                background:
                  "linear-gradient(180deg, oklch(0.955 0.014 80) 0%, oklch(0.915 0.020 78) 100%)",
                boxShadow: "inset 0 -30px 50px -30px oklch(0.30 0.03 60 / 45%)",
              }}
            />
          </div>

          {/* wax seal */}
          {!flapOpen && (
            <button
              type="button"
              onClick={handleOpen}
              aria-label="Tap the seal to open the invitation"
              className="group absolute aspect-square rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4"
              style={{
                left: "var(--envelope-seal-left)",
                top: "var(--envelope-seal-top)",
                width: "var(--envelope-seal-size)",
                zIndex: 50,
                transform: `translate(-50%, -50%) scale(${opening ? 1.14 : 1}) rotate(${opening ? -16 : 0}deg) translateY(${opening ? "14%" : "0%"})`,
                opacity: opening ? 0 : 1,
                transition:
                  "transform 1.5s var(--ease-silk), opacity 1.15s ease-in-out 0.25s",
                pointerEvents: opening ? "none" : "auto",
              }}
            >
              <span className="sr-only">Open invitation</span>
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full"
                style={{ animation: "sealPulse 2.8s ease-out infinite" }}
              />
              <img
                src={sealImage}
                alt=""
                width={1024}
                height={1024}
                aria-hidden="true"
                className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.08] group-active:scale-95"
                style={{
                  animation: "sealBreathe 6s ease-in-out infinite",
                  filter:
                    "saturate(1.45) sepia(0.24) hue-rotate(-10deg) brightness(1.03) drop-shadow(0 10px 18px oklch(0.42 0.07 54 / 45%))",
                }}
              />
            </button>
          )}

          <div
            className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 text-center"
            style={{
              top: "var(--envelope-hint-top)",
              opacity: opening ? 0 : 1,
              transition: "opacity 0.9s ease-out",
              animation: "hintFade 3.2s ease-in-out infinite",
            }}
          >
            <span className="mb-3 block font-serif text-lg text-[var(--gold)]">⌁</span>
            <span className="label-caps block whitespace-nowrap text-[0.72rem] tracking-[0.34em] text-[var(--wax)] sm:text-[0.82rem]">
              Tap the seal to begin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
