/**
 * Item types we support. Pass/Fail/NA is the base; numeric and text are common
 * additions. Photo-required is a modifier on any item.
 */
export type TemplateItemType =
  | 'pass_fail_na'   // Pass / Fail / N/A (the core IMS type)
  | 'numeric'        // Numeric reading with optional min/max
  | 'text'           // Free-text answer
  | 'single_select'  // Choose one from a fixed list

export type TemplateStatus =
  | 'draft'       // Editable, not in use
  | 'published'   // Active, used by inspections
  | 'superseded'  // Previously published, replaced by a newer version
  | 'archived'    // Manually retired

export interface TemplateVersionChange {
  id: string
  /** ISO timestamp */
  at: string
  /** User id who made the change */
  byId: string
  /** User display name */
  byName: string
  /** Action verb */
  action: 'created' | 'edited' | 'published' | 'archived' | 'restored' | 'superseded' | 'duplicated'
  /** Optional summary written by the publisher (for 'published') */
  note?: string
}

export type InspectionTypeKey = 'gmp' | 'haccp' | 'safety_walk' | 'sanitation' | 'allergen' | 'custom'

export interface TemplateItem {
  id: string
  /** The question or check shown to the inspector */
  prompt: string
  type: TemplateItemType
  /** True if a Fail/NA answer requires an observation note */
  observationRequiredOnFail: boolean
  /** True if the item requires photo evidence */
  photoRequired: boolean
  /** True if this item is mandatory (cannot be skipped) */
  required: boolean
  /** For numeric items, optional bounds for valid readings */
  numericMin?: number
  numericMax?: number
  numericUnit?: string
  /** For single-select items */
  options?: string[]
  /** Optional reference to a Parameter library item — populates the prompt automatically */
  parameterRef?: string
  /** Optional regulatory or SOP reference, shown to the inspector as context */
  reference?: string
}

export interface TemplateSection {
  id: string
  title: string
  /** Optional one-line description shown under the section title */
  description?: string
  items: TemplateItem[]
}

export interface Template {
  id: string
  /**
   * The stable identity of the template across versions.
   * All revisions of the same logical template share this baseTemplateId.
   * For brand-new templates, baseTemplateId === id.
   */
  baseTemplateId: string
  /** ISO version string like "0.1", "1.0", "1.1", "2.0". */
  version: string
  /** The previous version snapshot's id, if this is a revision. */
  parentVersionId?: string
  /** If this version was superseded, the id of the version that replaced it. */
  supersededBy?: string

  name: string
  summary: string
  inspectionType: InspectionTypeKey
  status: TemplateStatus
  siteIds: string[]
  tags: string[]
  sections: TemplateSection[]
  ownerId: string
  ownerName: string
  /** ISO timestamps */
  createdAt: string
  updatedAt: string
  /** Total items across all sections — denormalized for fast list rendering */
  itemCount: number
  /** Append-only changelog. Newest entry first. */
  changelog: TemplateVersionChange[]
}

/* ============================================================
 * Pure derivations — used by list, detail, future builder
 * ============================================================ */

export function getItemCount(template: Pick<Template, 'sections'>): number {
  return template.sections.reduce((sum, s) => sum + s.items.length, 0)
}

export function getRequiredCount(template: Pick<Template, 'sections'>): number {
  return template.sections.reduce(
    (sum, s) => sum + s.items.filter((i) => i.required).length,
    0
  )
}

export function getPhotoRequiredCount(template: Pick<Template, 'sections'>): number {
  return template.sections.reduce(
    (sum, s) => sum + s.items.filter((i) => i.photoRequired).length,
    0
  )
}
