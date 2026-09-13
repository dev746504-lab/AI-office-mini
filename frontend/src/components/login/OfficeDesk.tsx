/** Placeholder SVG cho bàn làm việc chung - thay bằng asset thiết kế thật sau. */
export function OfficeDesk() {
  return (
    <svg viewBox="0 0 1000 90" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="desk-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22406f" />
          <stop offset="100%" stopColor="#16294a" />
        </linearGradient>
        <linearGradient id="desk-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#132242" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="18" rx="10" fill="url(#desk-top)" />
      <rect x="0" y="14" width="1000" height="76" fill="url(#desk-face)" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 112 + 30} y="30" width="1" height="46" fill="#00d9f5" opacity="0.05" />
      ))}
    </svg>
  );
}
