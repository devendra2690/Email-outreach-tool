import { ShoppingBag, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'

function ProductImage({ product }) {
  return (
    <div
      className="w-full h-64 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${product.colorFrom}, ${product.colorTo})` }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 10px)',
        }}
      />
      <span className="text-white/20 text-8xl select-none">◈</span>
      <p className="text-white/70 text-sm font-medium mt-2 px-4 text-center leading-snug">
        {product.name}
      </p>
    </div>
  )
}

export default function ProductCard({ product }) {
  const { navigate, addToCart } = useApp()

  const handleQuickAdd = e => {
    e.stopPropagation()
    addToCart(product, product.sizes[0], product.colors[0], 1)
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate('product-detail', product)}
    >
      <div className="relative">
        <ProductImage product={product} />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-white text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {product.badge}
          </span>
        )}
        <button
          onClick={handleQuickAdd}
          className="absolute bottom-3 right-3 bg-white text-indigo-600 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 hover:text-white"
          title="Quick add to cart"
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs text-indigo-500 font-medium mb-1">{product.category}</p>
        <h3 className="text-gray-900 font-semibold text-sm mb-2 leading-snug">{product.name}</h3>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= Math.round(product.rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-bold">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-gray-400 text-sm line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
