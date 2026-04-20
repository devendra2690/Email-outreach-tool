import React, { useState } from 'react'
import { Search, Mail, Key, Settings } from 'lucide-react'
import LeadFinder from './pages/LeadFinder'
import EmailVerifier from './pages/EmailVerifier'
import ApiKeys from './pages/ApiKeys'
import SettingsPage from './pages/Settings'

const NAV_ITEMS = [
  { id: 'leads', label: 'Lead Finder', icon: Search },
  { id: 'verifier', label: 'Email Verifier', icon: Mail },
  { id: 'keys', label: 'API Keys', icon: Key },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export default function App() {
  const [page, setPage] = useState('leads')

  const renderPage = () => {
    switch (page) {
      case 'leads': return <LeadFinder />
      case 'verifier': return <EmailVerifier />
      case 'keys': return <ApiKeys />
      case 'settings': return <SettingsPage />
      default: return <LeadFinder />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 w-60 h-full overflow-y-auto"
        style={{ backgroundColor: '#1e293b' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg">
            <Search className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">DMOT</span>
            <p className="text-slate-400 text-xs leading-none mt-0.5">Outreach Tool</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs">v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {renderPage()}
      </main>
    </div>
  )
}
