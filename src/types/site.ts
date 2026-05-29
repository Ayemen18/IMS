export type SiteStatus = 'active' | 'archived' | 'commissioning'

export interface Site {
  id: string            // 'site_pune_plant'
  name: string          // 'Pune Plant'
  code: string          // 'PUNE-01'
  city: string
  country: string
  timezone: string      // 'Asia/Kolkata'
  status: SiteStatus
  
  // Compliance context
  certifications: string[]  // ['HACCP', 'GMP', 'ISO 22000']
  primaryDomain: 'quality' | 'safety' | 'both'
  
  // Tracking
  managerId: string | null      // user ID of site manager
  managerName: string | null
  commissionedAt: string         // ISO date
  archivedAt: string | null
  
  // Metadata
  createdAt: string
  updatedAt: string
  notes?: string
}

export type DepartmentKind = 
  | 'production' 
  | 'quality_lab' 
  | 'warehouse' 
  | 'packaging' 
  | 'maintenance' 
  | 'office' 
  | 'utility'

export interface Department {
  id: string                  // 'dept_pune_line3'
  siteId: string              // 'site_pune_plant'
  name: string                // 'Line 3'
  code: string                // 'L3'
  kind: DepartmentKind
  
  // Hierarchy — keep flat for v1, no nested departments
  // Areas are just strings; don't model them as entities
  areas: string[]             // ['Filler', 'Capper', 'Labeller']
  
  // Tracking
  headId: string | null       // user ID
  headName: string | null
  active: boolean
  
  createdAt: string
  updatedAt: string
}
