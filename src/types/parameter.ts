export type ParameterType =
  | 'pass_fail_na'
  | 'numeric'
  | 'text'
  | 'single_select'

export interface Parameter {
  id: string                  // e.g. 'param_fill_temp'
  name: string                // Display name like "CCP-2 Filling temperature"
  /** Short code, often used in inspector view, e.g. "FILL-TEMP" */
  code: string
  /** Inspection prompt that gets used when item references this param */
  prompt: string
  type: ParameterType
  /** Category for organizing the library; e.g. "Temperature", "Sanitation", "Allergen", "Mechanical" */
  category: string
  /** Optional unit for numeric */
  numericUnit?: string
  numericMin?: number
  numericMax?: number
  /** Options for single_select */
  options?: string[]
  /** SOP / regulation reference shown to inspector as context */
  reference?: string
  /** True if Fail/NA needs an observation */
  observationRequiredOnFail: boolean
  /** True if photo is required */
  photoRequired: boolean
  /** Description shown in the parameter detail and picker */
  description: string
  /** Tags for filtering */
  tags: string[]
  ownerId: string
  ownerName: string
  createdAt: string
  updatedAt: string
}
