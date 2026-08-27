"use client";

import Image from "next/image";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LogoLoader({
  size = "md",
  text = "Chargement en cours...",
  fullScreen = false,
  className = "",
}: LogoLoaderProps) {
  /**
   * ringSize  = diameter of the spinning circle (outer wrapper)
   * logoSize  = pixel size passed to <Image>
   * fontSize  = label text size
   *
   * The logo sits INSIDE the ring — the ring spins around it.
   * We use a single relative container sized to ringSize; the
   * spinning border is applied to that same container, and the
   * logo image is absolutely centred inside it.
   */
  const sizeConfig = {
    sm: { ring: "w-16 h-16",  logo: 36,  fontSize: "text-xs"  },
    md: { ring: "w-24 h-24",  logo: 54,  fontSize: "text-sm"  },
    lg: { ring: "w-32 h-32",  logo: 72,  fontSize: "text-base" },
    xl: { ring: "w-40 h-40",  logo: 90,  fontSize: "text-lg"  },
  };

  const cfg = sizeConfig[size] ?? sizeConfig.md;

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 select-none ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text || "Chargement"}
    >
      {/* ── Spinning ring + centred logo ── */}
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring */}
        <div
          className={`${cfg.ring} rounded-full border-4 border-[#96D0EE]/30 dark:border-[#004B70]/40 border-t-[#004B70] dark:border-t-[#96D0EE] animate-spin`}
          style={{ animationDuration: "1.1s" }}
          aria-hidden="true"
        />

        {/* Inner second ring (counter-spin, slower) */}
        <div
          className="absolute rounded-full border-2 border-transparent border-b-[#004B70]/40 dark:border-b-[#96D0EE]/40 animate-spin"
          style={{
            width: "calc(100% - 12px)",
            height: "calc(100% - 12px)",
            animationDuration: "1.8s",
            animationDirection: "reverse",
          }}
          aria-hidden="true"
        />

        {/* Logo — absolutely centred inside the ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Subtle glow disc behind logo */}
          <div
            className="absolute rounded-full bg-[#004B70]/10 dark:bg-[#96D0EE]/10 blur-sm"
            style={{ width: cfg.logo + 16, height: cfg.logo + 16 }}
            aria-hidden="true"
          />
          <Image
            src="/images/logo1.png"
            alt="Chargement..."
            width={cfg.logo}
            height={cfg.logo}
            className="object-contain relative z-10 animate-pulse drop-shadow-md"
            priority
          />
        </div>
      </div>

      {/* Label + bouncing dots */}
      {text && (
        <div className="flex items-center gap-1.5">
          <p
            className={`font-semibold tracking-wide text-gray-700 dark:text-slate-200 ${cfg.fontSize}`}
          >
            {text}
          </p>
          <span className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-[#004B70] dark:bg-[#96D0EE] animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center transition-colors">
        {content}
      </div>
    );
  }

  return content;
}
