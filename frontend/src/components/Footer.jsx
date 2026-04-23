import { Shirt, Mail, Phone, MapPin } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Footer() {
  const { navigate } = useApp()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Shirt className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Fabric & Thread</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Your destination for premium quality garments. We offer the finest in men's, women's,
              and children's fashion with exceptional craftsmanship.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>hello@fabricandthread.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>+1 (555) 012-3456</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>123 Fashion Ave, New York, NY 10001</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              {["Men's", "Women's", "Kids'", 'Accessories', 'Sale Items'].map(cat => (
                <li key={cat}>
                  <button
                    onClick={() => navigate('products')}
                    className="hover:text-white transition-colors"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Help</h3>
            <ul className="space-y-2 text-sm">
              {['Size Guide', 'Shipping Policy', 'Returns & Exchanges', 'FAQ', 'Track Order'].map(link => (
                <li key={link}>
                  <span className="hover:text-white transition-colors cursor-pointer">{link}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Fabric & Thread. All rights reserved.</p>
          <p>Made with ♥ for fashion lovers</p>
        </div>
      </div>
    </footer>
  )
}
