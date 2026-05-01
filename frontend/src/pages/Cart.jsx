import { Trash2, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { useApp } from '../context/AppContext'

function CartItem({ item }) {
  const { removeFromCart, updateQty } = useApp()

  return (
    <div className="flex gap-4 py-5 border-b border-gray-100 last:border-0">
      <div
        className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${item.product.colorFrom}, ${item.product.colorTo})`,
        }}
      >
        <span className="text-white/40 text-3xl select-none">◈</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-indigo-500 font-medium">{item.product.category}</p>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.product.name}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {item.size} · {item.color}
            </p>
          </div>
          <button
            onClick={() => removeFromCart(item.key)}
            className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={() =>
                item.qty > 1 ? updateQty(item.key, item.qty - 1) : removeFromCart(item.key)
              }
              className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg text-sm transition-colors"
            >
              −
            </button>
            <span className="px-3 py-1 text-sm font-medium border-x border-gray-200 min-w-[2.5rem] text-center">
              {item.qty}
            </span>
            <button
              onClick={() => updateQty(item.key, item.qty + 1)}
              className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg text-sm transition-colors"
            >
              +
            </button>
          </div>
          <span className="font-bold text-gray-900">
            ₹{(item.product.price * item.qty).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Cart() {
  const { cart, cartTotal, navigate } = useApp()
  const shipping = cartTotal >= 5000 ? 0 : 99
  const total = cartTotal + shipping

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add some products to get started</p>
        <button
          onClick={() => navigate('products')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Browse Products
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('products')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Continue Shopping
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6">
          {cart.map(item => (
            <CartItem key={item.key} item={item} />
          ))}
        </div>

        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Order Summary</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-indigo-500">
                  Add ₹{(5000 - cartTotal).toLocaleString('en-IN')} more for free shipping
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-indigo-600 text-lg">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('checkout')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <span>🔒</span>
              <span>Secure SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
