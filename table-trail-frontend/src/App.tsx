import { Routes, Route } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { DatabaseOverviewPage } from './pages/DatabaseOverviewPage'
import { NewConnectionPage } from './pages/NewConnectionPage'
import { DatabaseDetailPage } from './pages/DatabaseDetailPage'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DatabaseOverviewPage />} />
        <Route path="/connect" element={<NewConnectionPage />} />
        <Route path="/database/:id" element={<DatabaseDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
