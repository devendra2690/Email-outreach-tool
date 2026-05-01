import { ArrowRight, Truck, RotateCcw, Shield, Headphones, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCard from '../components/ProductCard'

const CATEGORIES = [
  { label: "Men's", desc: 'Shirts, Pants, Blazers & more', colorFrom: '#475569', colorTo: '#1e3a5f', emoji: '👔' },
  { label: "Women's", desc: 'Dresses, Tops, Skirts & more', colorFrom: '#f9a8d4', colorTo: '#db2777', emoji: '👗' },
  { label: "Kids'", desc: 'Comfy & fun styles for all ages', colorFrom: '#fbbf24', colorTo: '#d97706', emoji: '🧸' },
  { label: 'Accessories', desc: 'Belts, Scarves & Bags', colorFrom: '#4ade80', colorTo: '#166534', emoji: '👜' },
]

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₹5,000' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: Headphones, title: '24/7 Support', desc: 'Here to help anytime' },
]

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    review: 'The quality of the fabrics is exceptional. My floral wrap dress gets compliments every time I wear it!',
    rating: 5,
    product: 'Floral Wrap Dress',
  },
  {
    name: 'Rahul M.',
    review: 'Best fitting chinos I\'ve ever owned. The stretch fabric makes them incredibly comfortable for all-day wear.',
    rating: 5,
    product: 'Slim Fit Chinos',
  },
  {
    name: 'Ananya K.',
    review: 'My kids love the fun print t-shirts! Great quality and they hold up well to multiple washes.',
    rating: 5,
    product: 'Fun Print T-Shirt Set',
  },
]

export default function Home() {
  const { navigate, products } = useApp()
  const featured = products.filter(p => p.badge === 'Bestseller' || p.badge === 'New Arrival').slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 30px)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-block bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              New Spring Collection 2026
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Dress with <span className="text-amber-300">Confidence.</span>
              <br />
              Style with <span className="text-amber-300">Purpose.</span>
            </h1>
            <p className="text-indigo-200 text-lg mb-8 max-w-lg">
              Discover premium garments crafted for every occasion. Quality you can feel, style you
              can trust.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('products')}
                className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-amber-300 hover:text-indigo-900 transition-colors flex items-center gap-2"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('products')}
                className="border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                View Collection
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-indigo-500">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 px-4 py-4">
                <Icon className="w-5 h-5 text-indigo-200 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-indigo-300 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
          <p className="text-gray-500">Find exactly what you're looking for</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => navigate('products')}
              className="group relative overflow-hidden rounded-2xl aspect-square flex flex-col items-center justify-center text-white hover:scale-105 transition-transform shadow-md"
              style={{ background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})` }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-white" />
              <span className="text-4xl mb-3">{cat.emoji}</span>
              <span className="font-bold text-lg">{cat.label}</span>
              <span className="text-white/70 text-xs mt-1 px-4 text-center">{cat.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Featured Products</h2>
              <p className="text-gray-500">Our top picks just for you</p>
            </div>
            <button
              onClick={() => navigate('products')}
              className="flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors text-sm"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          className="rounded-2xl p-10 md:p-16 text-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px)',
            }}
          />
          <div className="relative">
            <p className="text-amber-300 font-semibold mb-3">Limited Time Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get 20% Off Your First Order</h2>
            <p className="text-blue-200 mb-8">
              Use code{' '}
              <span className="bg-white/20 font-mono px-3 py-1 rounded-lg text-white">
                WELCOME20
              </span>{' '}
              at checkout
            </p>
            <button
              onClick={() => navigate('products')}
              className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-10 py-3 rounded-xl transition-colors"
            >
              Shop the Sale
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
            <p className="text-gray-500">Join thousands of happy shoppers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4 italic">"{t.review}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">Purchased: {t.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
