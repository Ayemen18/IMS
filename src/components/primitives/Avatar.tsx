interface AvatarProps {
  name: string
  /** Optional Tailwind size class set, e.g. 'w-8 h-8 text-[11px]' */
  size?: string
  /** Optional accent class for the background (defaults to ink) */
  accent?: string
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, size = 'w-8 h-8 text-[11px]', accent }: AvatarProps) {
  const bg = accent ?? 'bg-ink-200 dark:bg-ink-700 text-ink-700 dark:text-ink-200'
  return (
    <div
      className={`shrink-0 rounded-full ${bg} flex items-center justify-center font-medium ${size}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
