import type { IconName } from '../../types/role'
import type { ReactNode } from 'react'

interface IconProps {
  name: IconName
  className?: string
  strokeWidth?: number
}

export function Icon({ name, className = 'w-4 h-4', strokeWidth = 1.5 }: IconProps) {
  const paths: Record<IconName, ReactNode> = {
    shield: <path d="M12 3l8 3v6c0 4.5-3.2 8.5-8 9-4.8-.5-8-4.5-8-9V6l8-3z" />,
    badge: (
      <>
        <path d="M12 3l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V6h4l3-3z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    check: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4v2h6V4" />
        <path d="M9 13l2 2 4-4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </>
    ),
    arrow_right: <path d="M5 12h14M13 6l6 6-6 6" />,
    arrow_left: <path d="M19 12H5M11 18l-6-6 6-6" />,
    arrow_up_right: <path d="M7 17L17 7M9 7h8v8" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 1 1 8 0v4" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>
    ),
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
    layers: (
      <>
        <path d="M12 2l10 6-10 6L2 8l10-6z" />
        <path d="M2 12l10 6 10-6" />
        <path d="M2 16l10 6 10-6" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eye_off: (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 6.1A10 10 0 0 1 22 12s-1 1.8-3 3.5" />
        <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    dot: <circle cx="12" cy="12" r="3" fill="currentColor" />,
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    box: (
      <>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
    bell: (
      <>
        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3z" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </>
    ),
    home: (
      <>
        <path d="M3 12l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="4" />
        <circle cx="17" cy="9" r="3" />
        <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
        <path d="M14 21c0-3 2-5 5-5s5 2 5 5" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1-1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    trending: (
      <>
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </>
    ),
    play: <path d="M5 3l14 9-14 9V3z" />,
    chevron_right: <path d="M9 6l6 6-6 6" />,
    chevron_down: <path d="M6 9l6 6 6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    filter: <path d="M4 4h16l-7 9v7l-2 1v-8L4 4z" />,
    download: <path d="M12 3v12M7 10l5 5 5-5M3 21h18" />,
    cube_3d: (
      <>
        <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" />
        <path d="M3 7l9 5 9-5" />
        <path d="M12 12v10" />
      </>
    ),
    link: (
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
