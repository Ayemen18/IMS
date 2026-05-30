import { useEffect, useRef, useState } from 'react'
import { Icon } from '../primitives/Icon'
import type { TemplateItemType } from '../../types/template'

const TYPES: { key: TemplateItemType; label: string; hint: string }[] = [
  { key: 'pass_fail_na',  label: 'Pass / Fail / N/A',  hint: 'Three-state inspection check' },
  { key: 'numeric',       label: 'Numeric',            hint: 'Reading with optional bounds' },
  { key: 'text',          label: 'Free text',          hint: 'Open-ended answer' },
  { key: 'single_select', label: 'Single select',      hint: 'Choose one from a list' },
]

interface Props {
  value: TemplateItemType
  onChange: (next: TemplateItemType) => void
}

export function ItemTypeMenu({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const current = TYPES.find((t) => t.key === value) ?? TYPES[0]

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-text-secondary border hairline hover:bg-accent-light transition-colors"
      >
        {current.label}
        <Icon name="chevron_down" className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-[220px] rounded-lg border hairline bg-white shadow-xl overflow-hidden animate-fade-in">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                onChange(t.key)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-accent-light transition-colors ${ value === t.key ? 'bg-accent-light ' : '' }`}
            >
              <Icon
                name={value === t.key ? 'check' : 'dot'}
                className={`w-3 h-3 mt-0.5 shrink-0 ${value === t.key ? 'text-text-primary ' : 'text-transparent'}`}
              />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-text-primary">{t.label}</div>
                <div className="text-[11px] text-text-secondary mt-0.5 truncate">{t.hint}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
