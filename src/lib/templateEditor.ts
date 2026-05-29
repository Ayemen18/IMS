import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type {
  Template,
  TemplateSection,
  TemplateItem,
  TemplateItemType,
} from '../types/template'
import { getItemCount } from '../types/template'

/* ============================================================
 * Action types — editor mutations
 * ============================================================ */

type EditorAction =
  | { type: 'init'; template: Template }
  | { type: 'setName'; value: string }
  | { type: 'setSummary'; value: string }
  | { type: 'setTags'; value: string[] }
  /* Section ops */
  | { type: 'addSection' }
  | { type: 'updateSection'; sectionId: string; patch: Partial<TemplateSection> }
  | { type: 'removeSection'; sectionId: string }
  | { type: 'reorderSections'; orderedIds: string[] }
  | { type: 'duplicateSection'; sectionId: string }
  /* Item ops */
  | { type: 'addItem'; sectionId: string; afterItemId?: string }
  | { type: 'updateItem'; sectionId: string; itemId: string; patch: Partial<TemplateItem> }
  | { type: 'removeItem'; sectionId: string; itemId: string }
  | { type: 'reorderItems'; sectionId: string; orderedIds: string[] }
  | { type: 'duplicateItem'; sectionId: string; itemId: string }
  | { type: 'moveItemBetweenSections'; itemId: string; fromSectionId: string; toSectionId: string; toIndex: number }

/* ============================================================
 * Factory helpers
 * ============================================================ */

let counter = 0
const genId = (prefix: string) => {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}

export function makeBlankTemplate(): Template {
  const newId = genId('tpl')
  return {
    id: newId,
    baseTemplateId: newId,
    name: '',
    summary: '',
    inspectionType: 'gmp',
    status: 'draft',
    version: '0.1',
    siteIds: [],
    tags: [],
    ownerId: 'usr_maya_chen',
    ownerName: 'Maya Chen',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemCount: 1,
    changelog: [
      {
        id: genId('chg'),
        at: new Date().toISOString(),
        byId: 'usr_maya_chen',
        byName: 'Maya Chen',
        action: 'created',
        note: 'Initial draft',
      },
    ],
    sections: [
      {
        id: genId('sec'),
        title: 'Untitled section',
        items: [makeBlankItem()],
      },
    ],
  }
}

export function makeBlankSection(): TemplateSection {
  return {
    id: genId('sec'),
    title: 'Untitled section',
    items: [makeBlankItem()],
  }
}

export function makeBlankItem(type: TemplateItemType = 'pass_fail_na'): TemplateItem {
  return {
    id: genId('itm'),
    prompt: '',
    type,
    observationRequiredOnFail: true,
    photoRequired: false,
    required: true,
  }
}

/* ============================================================
 * Reducer
 * ============================================================ */

function recompute(template: Template): Template {
  return {
    ...template,
    itemCount: getItemCount(template),
    updatedAt: new Date().toISOString(),
  }
}

function reducer(state: Template, action: EditorAction): Template {
  switch (action.type) {
    case 'init':
      return action.template

    case 'setName':
      return recompute({ ...state, name: action.value })

    case 'setSummary':
      return recompute({ ...state, summary: action.value })

    case 'setTags':
      return recompute({ ...state, tags: action.value })

    case 'addSection':
      return recompute({
        ...state,
        sections: [...state.sections, makeBlankSection()],
      })

    case 'updateSection':
      return recompute({
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId ? { ...s, ...action.patch } : s
        ),
      })

    case 'removeSection':
      return recompute({
        ...state,
        sections: state.sections.filter((s) => s.id !== action.sectionId),
      })

    case 'reorderSections': {
      const map = new Map(state.sections.map((s) => [s.id, s]))
      const ordered = action.orderedIds
        .map((id) => map.get(id))
        .filter(Boolean) as TemplateSection[]
      return recompute({ ...state, sections: ordered })
    }

    case 'duplicateSection': {
      const src = state.sections.find((s) => s.id === action.sectionId)
      if (!src) return state
      const copy: TemplateSection = {
        ...src,
        id: genId('sec'),
        title: `${src.title} (copy)`,
        items: src.items.map((i) => ({ ...i, id: genId('itm') })),
      }
      const idx = state.sections.findIndex((s) => s.id === action.sectionId)
      const next = [...state.sections]
      next.splice(idx + 1, 0, copy)
      return recompute({ ...state, sections: next })
    }

    case 'addItem': {
      return recompute({
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== action.sectionId) return s
          const newItem = makeBlankItem()
          if (action.afterItemId) {
            const idx = s.items.findIndex((i) => i.id === action.afterItemId)
            const items = [...s.items]
            items.splice(idx + 1, 0, newItem)
            return { ...s, items }
          }
          return { ...s, items: [...s.items, newItem] }
        }),
      })
    }

    case 'updateItem':
      return recompute({
        ...state,
        sections: state.sections.map((s) =>
          s.id !== action.sectionId
            ? s
            : { ...s, items: s.items.map((i) => (i.id === action.itemId ? { ...i, ...action.patch } : i)) }
        ),
      })

    case 'removeItem':
      return recompute({
        ...state,
        sections: state.sections.map((s) =>
          s.id !== action.sectionId
            ? s
            : { ...s, items: s.items.filter((i) => i.id !== action.itemId) }
        ),
      })

    case 'reorderItems':
      return recompute({
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== action.sectionId) return s
          const map = new Map(s.items.map((i) => [i.id, i]))
          const ordered = action.orderedIds.map((id) => map.get(id)).filter(Boolean) as TemplateItem[]
          return { ...s, items: ordered }
        }),
      })

    case 'duplicateItem':
      return recompute({
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== action.sectionId) return s
          const src = s.items.find((i) => i.id === action.itemId)
          if (!src) return s
          const copy: TemplateItem = { ...src, id: genId('itm') }
          const idx = s.items.findIndex((i) => i.id === action.itemId)
          const items = [...s.items]
          items.splice(idx + 1, 0, copy)
          return { ...s, items }
        }),
      })

    case 'moveItemBetweenSections': {
      const src = state.sections.find((s) => s.id === action.fromSectionId)
      const item = src?.items.find((i) => i.id === action.itemId)
      if (!src || !item) return state
      return recompute({
        ...state,
        sections: state.sections.map((s) => {
          if (s.id === action.fromSectionId) {
            return { ...s, items: s.items.filter((i) => i.id !== action.itemId) }
          }
          if (s.id === action.toSectionId) {
            const items = [...s.items]
            items.splice(action.toIndex, 0, item)
            return { ...s, items }
          }
          return s
        }),
      })
    }

    default:
      return state
  }
}

/* ============================================================
 * Public hook
 * ============================================================ */

export interface UseTemplateEditorApi {
  draft: Template
  dispatch: React.Dispatch<EditorAction>
  isDirty: boolean
  markClean: () => void
  /** Returns error message if invalid, null if valid. */
  validate: () => string | null
}

const AUTOSAVE_KEY_PREFIX = 'ims-template-draft:'

export function useTemplateEditor(initial: Template): UseTemplateEditorApi {
  const [draft, dispatch] = useReducer(reducer, initial)
  const initialJsonRef = useRef<string>(JSON.stringify(initial))
  const [, forceUpdate] = useState(0)

  const isDirty = JSON.stringify(draft) !== initialJsonRef.current

  // Autosave draft to localStorage on every change
  useEffect(() => {
    try {
      window.localStorage.setItem(
        `${AUTOSAVE_KEY_PREFIX}${draft.id}`,
        JSON.stringify(draft)
      )
    } catch {
      // ignore
    }
  }, [draft])

  // Beforeunload warning if dirty
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const markClean = useCallback(() => {
    initialJsonRef.current = JSON.stringify(draft)
    forceUpdate((n) => n + 1)
    try {
      window.localStorage.removeItem(`${AUTOSAVE_KEY_PREFIX}${draft.id}`)
    } catch {
      // ignore
    }
  }, [draft])

  const validate = useCallback((): string | null => {
    if (!draft.name.trim()) return 'Template name is required.'
    if (draft.sections.length === 0) return 'Add at least one section.'
    const emptySection = draft.sections.find((s) => s.items.length === 0)
    if (emptySection) return `Section "${emptySection.title || 'Untitled'}" has no items.`
    const emptyItem = draft.sections
      .flatMap((s) => s.items)
      .find((i) => !i.prompt.trim())
    if (emptyItem) return 'Every item needs a prompt.'
    return null
  }, [draft])

  return { draft, dispatch, isDirty, markClean, validate }
}

/* ============================================================
 * Autosave recovery helper
 * ============================================================ */

export function loadAutosavedDraft(templateId: string): Template | null {
  try {
    const raw = window.localStorage.getItem(`${AUTOSAVE_KEY_PREFIX}${templateId}`)
    if (!raw) return null
    return JSON.parse(raw) as Template
  } catch {
    return null
  }
}
