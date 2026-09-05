import { useEffect, useState } from "react";

import fleur from "@/assets/countdown-fleur.png";
import rule from "@/assets/countdown-rule.png";
import scene from "@/assets/countdown-scene-v3.png";

function assetSrc(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

// Saturday 9 January 2027, midnight in Chiang Mai (UTC+7)
const TARGET = new Date("2027-01-09T00:00:00+07:00").getTime();

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function timeLeft(): Parts {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

function Separator() {
  return (
    <span
      aria-hidden="true"
      className="flex h-14 flex-col items-center justify-center sm:h-20"
    >
      <span className="w-px flex-1 bg-gold-deep/45" />
      <span className="my-[3px] block h-[5px] w-[5px] rotate-45 bg-gold-deep sm:h-[6px] sm:w-[6px]" />
      <span className="w-px flex-1 bg-gold-deep/45" />
    </span>
  );
}

export function CountdownSection() {
  const [left, setLeft] = useState<Parts | null>(null);

  useEffect(() => {
    setLeft(timeLeft());
    const timer = window.setInterval(() => setLeft(timeLeft()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const units: Array<{ value: number | null; label: string; pad: number }> = [
    { value: left?.days ?? null, label: "Days", pad: 1 },
    { value: left?.hours ?? null, label: "Hours", pad: 2 },
    { value: left?.minutes ?? null, label: "Minutes", pad: 2 },
    { value: left?.seconds ?? null, label: "Seconds", pad: 2 },
  ];

  return (
    <section
      aria-label="Countdown to the wedding day"
      className="story-section relative flex min-h-svh flex-col overflow-hidden bg-ivory"
    >
      {/* typography block */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-6 pt-12 text-center sm:px-8 sm:pt-16">
        <img
          src={assetSrc(fleur)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={167}
          height={223}
          className="w-7 opacity-95 sm:w-9"
        />

        <h2
          className="mt-5 font-display text-[1.6rem] uppercase leading-none text-foreground sm:mt-7 sm:text-[2.6rem]"
          style={{ letterSpacing: "0.16em" }}
        >
          Until we say
        </h2>
        <p
          className="mt-2 font-display text-[1.6rem] italic leading-none text-foreground sm:mt-3 sm:text-[2.6rem]"
          style={{ letterSpacing: "0.08em" }}
        >
          “I DO”
        </p>

        {/* counter row */}
        <div className="mt-8 flex w-full max-w-[34rem] items-stretch justify-center sm:mt-12">
          {units.map((unit, index) => (
            <div key={unit.label} className="flex flex-1 items-center justify-center">
              {index > 0 && <Separator />}
              <div className="flex flex-1 flex-col items-center">
                <span
                  className="font-display text-[2.1rem] leading-none text-foreground sm:text-[3.6rem]"
                  style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
                >
                  {unit.value === null ? "—" : String(unit.value).padStart(unit.pad, "0")}
                </span>
                <span
                  className="mt-2 text-[0.5rem] uppercase text-foreground sm:mt-3 sm:text-[0.68rem]"
                  style={{ letterSpacing: "0.16em" }}
                >
                  {unit.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* thin gold rule with centre flourish */}
        <img
          src={assetSrc(rule)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1453}
          height={121}
          className="mx-auto mt-8 w-48 opacity-90 sm:mt-12 sm:w-72"
        />

        <p
          className="mt-6 font-display text-[1.1rem] text-foreground sm:mt-8 sm:text-[1.7rem]"
          style={{ letterSpacing: "0.14em", fontVariantNumeric: "lining-nums" }}
        >
          09 · 01 · 2027
        </p>

        <p
          className="mt-5 text-[0.5rem] uppercase leading-[2] text-foreground sm:mt-7 sm:text-[0.66rem]"
          style={{ letterSpacing: "0.2em" }}
        >
          A lifetime of
          <br />
          beautiful moments awaits
        </p>
      </div>

      {/* photographic scene — the ivory wall in the photo continues the page */}
      <img
        src={assetSrc(scene)}
        alt="A champagne coupe, silk ribbon and a handwritten note resting on a marble table"
        loading="lazy"
        width={900}
        height={615}
        className="block w-full flex-none object-cover"
        style={{
          height: "min(40svh, 52vw + 7rem)",
          objectPosition: "left top",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 3%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 3%)",
        }}
      />
    </section>
  );
}
