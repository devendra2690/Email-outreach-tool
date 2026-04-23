import { useState } from 'react'
import { Star, ShoppingBag, ArrowLeft, Truck, RotateCcw, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'

function ProductImage({ product }) {
  return (
    <div
      className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${product.colorFrom}, ${product.colorTo})` }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 10px)',
        }}
      />
      <span className="text-white/20 text-9xl select-none">◈</span>
      <p className="text-white/60 text-base font-medium mt-4 px-8 text-center leading-snug">
        {product.name}
      </p>
    </div>
  )
}

export default function ProductDetail() {
  const { selectedProduct: product, navigate, addToCart } = useApp()
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) return null

  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const canAdd = selectedSize && selectedColor

  const handleAddToCart = () => {
    if (!canAdd) return
    addToCart(product, selectedSize, selectedColor, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (!canAdd) return
    addToCart(product, selectedSize, selectedColor, qty)
    navigate('checkout')
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('products')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <ProductImage product={product} />

        <div>
          <div className="flex items-start justify-between mb-2">
            <p className="text-indigo-600 text-sm font-medium">{product.category}</p>
            {product.badge && (
              <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                {product.badge}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(product.rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600 text-sm">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <>
                <span className="text-gray-400 text-xl line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                <span className="bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>

          {/* Color */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">Color</p>
              {selectedColor && <p className="text-sm text-gray-500">{selectedColor}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    selectedColor === color
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">Size</p>
              {!selectedSize && <p className="text-xs text-red-500">Please select a size</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    selectedSize === size
                      ? 'border-indigo-600 bg-indigo-600 text-white font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-semibold text-gray-900">Quantity</p>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg transition-colors"
              >
                −
              </button>
              <span className="px-4 py-2 text-gray-900 font-medium border-x border-gray-200 min-w-[3rem] text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={!canAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                added
                  ? 'bg-green-500 text-white'
                  : canAdd
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              {added ? 'Added to Cart!' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!canAdd}
              className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-colors ${
                canAdd
                  ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Buy Now
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
            {[
              { icon: Truck, text: 'Free shipping over $75' },
              { icon: RotateCcw, text: '30-day returns' },
              { icon: Shield, text: 'Secure checkout' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 text-center">
                <Icon className="w-5 h-5 text-indigo-400" />
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            ))}
          </div>

          {/* Care */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Care Instructions</p>
            <p className="text-sm text-gray-500">{product.care}</p>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
