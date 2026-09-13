// Shared line-icon set — replaces emoji across the app so icon weight, size
// and color stay consistent with the editorial brand (thin strokes, currentColor).
// All icons inherit text color, so they tint with whatever wraps them.

function Svg({ size = 16, className = '', strokeWidth = 1.75, children, fill = 'none' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ── Time of day ─────────────────────────────────────────────────────────── */
export const IconSunrise = (p) => (
  <Svg {...p}><path d="M12 2v4M4.9 8.9l2.9 2.9M2 18h2M20 18h2M16.2 11.8l2.9-2.9M22 22H2M16 18a4 4 0 0 0-8 0" /></Svg>
);
export const IconSun = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" /></Svg>
);
export const IconMoon = (p) => (
  <Svg {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>
);

/* ── Activity categories ─────────────────────────────────────────────────── */
export const IconLandmark = (p) => (
  <Svg {...p}><path d="M3 22h18M4 10h16M5 10v12M19 10v12M9 10v12M15 10v12M12 2l9 5H3l9-5Z" /></Svg>
);
export const IconUtensils = (p) => (
  <Svg {...p}><path d="M4 2v7a3 3 0 0 0 6 0V2M7 9v13M18 2c-1.7 1.2-2.5 3.2-2.5 5.5S16.3 12 18 13v9" /></Svg>
);
export const IconTarget = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></Svg>
);
export const IconBus = (p) => (
  <Svg {...p}><path d="M4 17V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10M4 11h16M7 20h.01M17 20h.01M6 17v2M18 17v2" /></Svg>
);
export const IconGlass = (p) => (
  <Svg {...p}><path d="M5 4h14l-7 8-7-8ZM12 12v8M8 20h8" /></Svg>
);
export const IconLeaf = (p) => (
  <Svg {...p}><path d="M4 20c0-8 5-14 16-15 0 11-5 15-11 15a8 8 0 0 1-5 0ZM6 20c2-4 5-7 9-9" /></Svg>
);
export const IconMountain = (p) => (
  <Svg {...p}><path d="M2 20h20L14 5l-4 7-2-3-6 11Z" /></Svg>
);
export const IconMapPin = (p) => (
  <Svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></Svg>
);

/* ── Meta / details ──────────────────────────────────────────────────────── */
export const IconCalendar = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>
);
export const IconWallet = (p) => (
  <Svg {...p}><path d="M20 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6" /><circle cx="17" cy="14" r="1.2" /></Svg>
);
export const IconWalk = (p) => (
  <Svg {...p}><circle cx="13" cy="4" r="2" /><path d="M11 21l1.5-6L9 12V8l4-1 3 3 3 1M9 21l2-5" /></Svg>
);
export const IconBulb = (p) => (
  <Svg {...p}><path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.7.8 1 1.7 1 2.5h6c0-.8.3-1.7 1-2.5A6 6 0 0 0 12 2Z" /></Svg>
);
export const IconBed = (p) => (
  <Svg {...p}><path d="M3 18V6M3 12h18a0 0 0 0 1 0 0v6M21 18v-4M3 12V9a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3" /><circle cx="7" cy="10" r="0.5" /></Svg>
);
export const IconBowl = (p) => (
  <Svg {...p}><path d="M3 11h18a9 9 0 0 1-18 0ZM7 11c0-2 1-3 2.5-3.5M12 4v3" /></Svg>
);
export const IconWine = (p) => (
  <Svg {...p}><path d="M8 3h8l-1 7a3 3 0 0 1-6 0L8 3ZM12 13v7M9 20h6M7.5 7h9" /></Svg>
);
export const IconClock = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);

/* ── Actions / UI ────────────────────────────────────────────────────────── */
export const IconLink = (p) => (
  <Svg {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Svg>
);
export const IconStar = ({ filled = false, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
  </Svg>
);
export const IconEye = (p) => (
  <Svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const IconUsers = (p) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 5.2a3.2 3.2 0 0 1 0 5.9M18 14.4a6.5 6.5 0 0 1 3.5 5.6" /></Svg>
);
export const IconPlane = (p) => (
  <Svg {...p}><path d="M2 13.5 21 4l-5.5 17-3-7-7-3.5Z" /><path d="m12.5 14 3.5-3.5" /></Svg>
);
export const IconSparkles = (p) => (
  <Svg {...p}><path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></Svg>
);
export const IconFile = (p) => (
  <Svg {...p}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" /><path d="M14 2v5h5M9 13h6M9 17h6" /></Svg>
);
export const IconMap = (p) => (
  <Svg {...p}><path d="m9 4 6 2 5-2v14l-5 2-6-2-5 2V6l5-2ZM9 4v14M15 6v14" /></Svg>
);
export const IconCheck = (p) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.25}><path d="m20 6-11 11-5-5" /></Svg>
);
export const IconArrowRight = (p) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);
export const IconChevronRight = (p) => (
  <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
);
export const IconAlert = (p) => (
  <Svg {...p}><path d="M12 3 2 20h20L12 3ZM12 10v4M12 17.5h.01" /></Svg>
);
export const IconX = (p) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.25}><path d="M18 6 6 18M6 6l12 12" /></Svg>
);
export const IconChat = (p) => (
  <Svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z" /><path d="M8.5 11h7M8.5 14.5h4" /></Svg>
);
export const IconPencil = (p) => (
  <Svg {...p}><path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Svg>
);

// Category → icon, used by the itinerary timeline.
export const CATEGORY_ICONS = {
  attraction: IconLandmark,
  food:       IconUtensils,
  activity:   IconTarget,
  transport:  IconBus,
  nightlife:  IconGlass,
  nature:     IconLeaf,
  viewpoint:  IconMountain,
};
