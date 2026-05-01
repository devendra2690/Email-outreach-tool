import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function OrderSuccess() {
  const { order, navigate } = useApp()

  if (!order) {
    navigate('home')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
      <p className="text-gray-500 mb-1">
        Thank you, <span className="font-semibold text-gray-700">{order.customer.name}</span>!
      </p>
      <p className="text-gray-500 mb-8">
        A confirmation will be sent to{' '}
        <span className="font-semibold text-gray-700">{order.customer.email}</span>
      </p>

      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Package className="w-5 h-5 text-indigo-500" />
          <p className="text-sm font-medium text-indigo-700">Order Number</p>
        </div>
        <p className="text-2xl font-bold text-indigo-600 font-mono">{order.id}</p>
        <p className="text-sm text-indigo-500 mt-1">Placed on {order.date}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 text-left">
        <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.key} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${item.product.colorFrom}, ${item.product.colorTo})`,
                }}
              >
                <span className="text-white/50 text-xs select-none">◈</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                <p className="text-xs text-gray-500">
                  {item.size} · {item.color} · Qty: {item.qty}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                ₹{(item.product.price * item.qty).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-indigo-600">₹{order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-left">
        <p className="font-semibold text-amber-800 mb-1">Delivery Information</p>
        <p className="text-sm text-amber-700">
          {order.customer.street}, {order.customer.city}, {order.customer.state}{' '}
          {order.customer.zip}
        </p>
        <p className="text-sm text-amber-600 mt-2">
          Estimated delivery: <strong>3–5 business days</strong>
        </p>
        <p className="text-sm text-amber-600 mt-1">
          Payment: <strong>{order.customer.payment === 'cod' ? 'Cash on Delivery' : 'Card'}</strong>
        </p>
      </div>

      <button
        onClick={() => navigate('home')}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
      >
        Continue Shopping <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
