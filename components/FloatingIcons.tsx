function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3v18M12 3l-6 3M12 3l6 3M4 8l2 5a2.5 2.5 0 004.6 0L12.6 8M20.6 8l-2-5.8M14.6 8l2 5a2.5 2.5 0 004.6 0l2-5M4 8l2-5.8M6 21h12"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GavelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M14 5l5 5M9.5 9.5l-6 6 2 2 6-6M12.5 6.5l5 5M2 22h9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path d="M14 3v4h4M9 12h6M9 15.5h6M9 8.5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-5 4V6a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

const ICONS = [
  { Icon: ScaleIcon, top: "8%", left: "3%", size: 62, duration: "10s", delay: "0s", driftX: "18px", driftY: "-16px", rot: "8deg" },
  { Icon: GavelIcon, top: "18%", right: "4%", size: 70, duration: "12s", delay: "1.2s", driftX: "-16px", driftY: "18px", rot: "-8deg" },
  { Icon: DocumentIcon, top: "48%", left: "1%", size: 56, duration: "9s", delay: "0.6s", driftX: "14px", driftY: "20px", rot: "-6deg" },
  { Icon: ChatIcon, top: "68%", right: "2%", size: 54, duration: "11s", delay: "2s", driftX: "-18px", driftY: "-14px", rot: "10deg" },
  { Icon: ScaleIcon, top: "82%", left: "4%", size: 46, duration: "10.5s", delay: "0.3s", driftX: "12px", driftY: "-18px", rot: "-10deg" },
  { Icon: DocumentIcon, top: "35%", right: "7%", size: 42, duration: "8.5s", delay: "1.8s", driftX: "-12px", driftY: "16px", rot: "8deg" },
] as const;

/**
 * Purely decorative legal-themed shapes drifting in the sidebar's empty
 * margin space — aria-hidden and pointer-events-none so they never affect
 * screen readers, keyboard navigation, or clicks. Fixed positions/timings
 * (not randomized) to avoid a server/client hydration mismatch.
 */
export function FloatingIcons() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block" aria-hidden>
      {ICONS.map(({ Icon, size, duration, delay, driftX, driftY, rot, ...pos }, i) => (
        <div
          key={i}
          className="floating-icon absolute text-[var(--accent)]/[0.14]"
          style={{
            ...pos,
            width: size,
            height: size,
            // @ts-expect-error -- CSS custom properties aren't in React's CSSProperties type
            "--drift-duration": duration,
            "--drift-delay": delay,
            "--drift-x": driftX,
            "--drift-y": driftY,
            "--drift-rot": rot,
          }}
        >
          <Icon className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
