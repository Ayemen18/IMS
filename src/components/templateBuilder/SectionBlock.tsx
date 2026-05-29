import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon } from '../primitives/Icon'
import { ItemRow } from './ItemRow'
import type { TemplateSection, TemplateItem } from '../../types/template'

interface SectionBlockProps {
  section: TemplateSection
  index: number
  onUpdateSection: (patch: Partial<TemplateSection>) => void
  onUpdateItem: (itemId: string, patch: Partial<TemplateItem>) => void
  onRemoveItem: (itemId: string) => void
  onDuplicateItem: (itemId: string) => void
  onAddItem: (afterItemId?: string) => void
  onReorderItems: (orderedIds: string[]) => void
  onRemoveSection: () => void
  onDuplicateSection: () => void
}

export function SectionBlock({
  section,
  index,
  onUpdateSection,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  onAddItem,
  onReorderItems,
  onRemoveSection,
  onDuplicateSection,
}: SectionBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  // Inner sensors for items
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleItemDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = section.items.findIndex((i) => i.id === active.id)
    const newIndex = section.items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const next = [...section.items]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    onReorderItems(next.map((i) => i.id))
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto' as any,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white dark:bg-ink-900 overflow-hidden transition-shadow ${
        isDragging ? 'shadow-2xl ring-1 ring-ink-200 dark:ring-ink-700 border-ink-300 dark:border-ink-600' : 'border-black/[0.06] dark:border-white/[0.08]'
      }`}
    >
      {/* Section header */}
      <div className="border-b hairline">
        <div className="grid grid-cols-[24px_24px_1fr_auto] gap-3 items-center px-5 py-3 bg-ink-50/50 dark:bg-ink-950/30">
          <button
            type="button"
            className="w-6 h-6 rounded flex items-center justify-center text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 cursor-grab active:cursor-grabbing transition-colors"
            aria-label="Drag section to reorder"
            {...attributes}
            {...listeners}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
              <circle cx="2" cy="2"  r="1" fill="currentColor" />
              <circle cx="8" cy="2"  r="1" fill="currentColor" />
              <circle cx="2" cy="7"  r="1" fill="currentColor" />
              <circle cx="8" cy="7"  r="1" fill="currentColor" />
              <circle cx="2" cy="12" r="1" fill="currentColor" />
              <circle cx="8" cy="12" r="1" fill="currentColor" />
            </svg>
          </button>
          <div className="font-mono text-[11px] text-ink-400 dark:text-ink-500 text-right">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdateSection({ title: e.target.value })}
              placeholder="Section title"
              className="w-full bg-transparent text-[15px] font-medium text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none focus:outline-none border-b border-transparent focus:border-ink-300 dark:focus:border-ink-600 transition-colors pb-0.5"
            />
            <input
              type="text"
              value={section.description ?? ''}
              onChange={(e) => onUpdateSection({ description: e.target.value || undefined })}
              placeholder="Optional description"
              className="w-full mt-0.5 bg-transparent text-[12px] text-ink-500 dark:text-ink-400 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none focus:outline-none border-b border-transparent focus:border-ink-200 dark:focus:border-ink-700 transition-colors pb-0.5"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 mr-1">
              {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
            </span>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="w-7 h-7 rounded flex items-center justify-center text-ink-400 dark:text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
                aria-label="Section actions"
              >
                <Icon name="chevron_down" className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 w-[180px] rounded-lg border hairline bg-white dark:bg-ink-900 shadow-xl overflow-hidden animate-fade-in">
                  <button
                    type="button"
                    onClick={() => { onDuplicateSection(); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-[12px] text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors"
                  >
                    <Icon name="layers" className="w-3.5 h-3.5" />
                    Duplicate section
                  </button>
                  <div className="border-t hairline" />
                  <button
                    type="button"
                    onClick={() => { onRemoveSection(); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-[12px] text-signal-red hover:bg-signal-red/5 transition-colors"
                  >
                    <Icon name="close" className="w-3.5 h-3.5" />
                    Delete section
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
        <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y hairline">
            {section.items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                index={idx}
                onUpdate={(patch) => onUpdateItem(item.id, patch)}
                onRemove={() => onRemoveItem(item.id)}
                onDuplicate={() => onDuplicateItem(item.id)}
                onAddBelow={() => onAddItem(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add item button */}
      <button
        type="button"
        onClick={() => onAddItem()}
        className="w-full px-5 py-3 border-t hairline text-[12px] text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800/60 hover:text-ink-900 dark:hover:text-ink-50 transition-colors flex items-center gap-2"
      >
        <Icon name="plus" className="w-3.5 h-3.5" />
        Add item to this section
      </button>
    </div>
  )
}
