import { useState } from 'react'
import { ShoppingBag, Menu, X, Shirt } from 'lucide-react'
import { useApp } from '../context/AppContext'

const NAV_LINKS = [
  { label: 'Home', page: 'home' },
  { label: 'Shop', page: 'products' },
]

export default function Navbar() {
  const { navigate, cartCount, page } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => navigate('home')} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="block text-lg font-bold text-gray-900 leading-none">Pravin Fashion</span>
              <span className="block text-xs text-gray-500 leading-none">Premium Garments</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <button
                key={link.page}
                onClick={() => navigate(link.page)}
                className={`text-sm font-medium transition-colors ${
                  page === link.page ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('cart')}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.page}
                onClick={() => { navigate(link.page); setMenuOpen(false) }}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
