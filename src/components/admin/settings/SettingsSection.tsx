import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../../primitives/Icon'

export function SettingsSection({
  id,
  title,
  description,
  isDirty,
  onSave,
  onDiscard,
  children,
}: {
  id: string
  title: ReactNode
  description: string
  isDirty: boolean
  onSave: () => void
  onDiscard: () => void
  children: ReactNode
}) {
  const [showSaved, setShowSaved] = useState(false)

  const handleSave = () => {
    onSave()
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  return (
    <section id={id} className="scroll-mt-32">
      <div className="mb-6">
        <h2 className="font-sans font-bold text-[26px] tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-[14px] text-text-secondary max-w-[560px]">
          {description}
        </p>
      </div>

      <div className="space-y-8">
        {children}
      </div>

      <div className="mt-8 flex items-center gap-3 pt-6 border-t border-text-secondary/15">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="btn-primary px-4 py-2 rounded-md bg-primary text-white text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-50"
        >
          Save changes
        </button>
        {isDirty && (
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-md border hairline bg-white text-[13px] font-medium text-text-secondary hover:bg-accent-light transition-colors"
          >
            Discard changes
          </button>
        )}
        {showSaved && !isDirty && (
          <div className="flex items-center gap-1.5 text-status-pass text-[13px] font-medium animate-fade-in ml-2">
            <Icon name="check" className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>
    </section>
  )
}

export function SettingsField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] md:grid-cols-[240px_1fr] gap-4 sm:gap-8 items-start">
      <div>
        <label className="block text-[13px] font-medium text-text-primary">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-[12px] text-text-secondary">
            {description}
          </p>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}
