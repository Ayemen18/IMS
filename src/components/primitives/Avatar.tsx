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
  const bg = accent ?? 'bg-accent-light text-text-secondary'
  return (
    <div
      className={`shrink-0 rounded-full ${bg} flex items-center justify-center font-medium ${size}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
