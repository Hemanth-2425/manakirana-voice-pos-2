interface ManaKiranaLogoProps {
  size?: number;
  isListening?: boolean;
  className?: string;
}

export function ManaKiranaLogo({
  size = 42,
  isListening = false,
  className = '',
}: ManaKiranaLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="ManaKirana Logo"
      className={`shrink-0 ${className}`.trim()}
    >
      <rect width="512" height="512" rx="108" fill="#065F46" />
      {/* Speech bubble body + bottom-left tail */}
      <ellipse cx="256" cy="288" rx="146" ry="128" fill="#FFFFFF" />
      <path d="M 154 366 L 146 432 Q 144 448 160 440 L 226 408 Z" fill="#FFFFFF" />
      {/* Clean emerald cutout gap behind the 3 scalloped awning flaps */}
      <g fill="#065F46" stroke="#065F46" strokeWidth="26" strokeLinejoin="round">
        <path d="M 156 88 L 210 88 L 194 154 A 36 36 0 0 1 124 146 Z" />
        <path d="M 228 88 L 284 88 L 292 152 A 36 36 0 0 1 220 152 Z" />
        <path d="M 302 88 L 356 88 L 388 146 A 36 36 0 0 1 318 154 Z" />
      </g>
      {/* 3 crisp white Kirana shopfront awning flaps */}
      <g fill="#FFFFFF">
        <path d="M 156 88 L 210 88 L 194 154 A 36 36 0 0 1 124 146 Z" />
        <path d="M 228 88 L 284 88 L 292 152 A 36 36 0 0 1 220 152 Z" />
        <path d="M 302 88 L 356 88 L 388 146 A 36 36 0 0 1 318 154 Z" />
      </g>
      {/* 3 vertical voice soundwave bars (center bar saffron gold) */}
      <rect
        x="196"
        y="254"
        width="28"
        height="84"
        rx="14"
        fill="#065F46"
        className={isListening ? 'animate-pulse' : ''}
      />
      <rect
        x="242"
        y="224"
        width="28"
        height="144"
        rx="14"
        fill="#F59E0B"
        className={isListening ? 'animate-bounce' : ''}
      />
      <rect
        x="288"
        y="254"
        width="28"
        height="84"
        rx="14"
        fill="#065F46"
        className={isListening ? 'animate-pulse' : ''}
      />
    </svg>
  );
}
