import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Columns3, ScrollText, ShieldCheck } from 'lucide-react'
import { ICON } from './components'
import Desk from './screens/Desk'
import ExpertCard from './screens/ExpertCard'
import Ledger from './screens/Ledger'

// Served under /app by the engine, which keeps the root namespace for the API.
export default function App() {
  return (
    <BrowserRouter basename="/app">
      <div className="shell">
        <header className="topbar">
          <span className="brand">
            <ShieldCheck {...ICON} color="var(--accent)" aria-hidden />
            Sealed Signals
          </span>
          <nav>
            <NavLink className="navlink" to="/desk">
              <Columns3 {...ICON} style={{ verticalAlign: '-3px', marginRight: 6 }} aria-hidden />
              Analyst desk
            </NavLink>
            <NavLink className="navlink" to="/ledger">
              <ScrollText {...ICON} style={{ verticalAlign: '-3px', marginRight: 6 }} aria-hidden />
              Public ledger
            </NavLink>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/desk" replace />} />
          <Route path="/desk" element={<Desk />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/e/:token" element={<ExpertCard />} />
          <Route path="*" element={<Navigate to="/desk" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
