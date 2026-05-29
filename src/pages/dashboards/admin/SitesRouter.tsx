import { Routes, Route } from 'react-router-dom'
import { SitesListPage } from './SitesListPage'
import { SiteDetailPage } from './SiteDetailPage'

export function SitesRouter() {
  return (
    <Routes>
      <Route path="/" element={<SitesListPage />} />
      <Route path="/:siteId" element={<SiteDetailPage />} />
    </Routes>
  )
}
