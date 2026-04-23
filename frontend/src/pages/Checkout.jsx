import { useState } from 'react'
import { ArrowLeft, CreditCard, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'

function Field({ label, name, type = 'text', placeholder, span2, form, errors, onChange }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
        }`}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  )
}

const EMPTY = { name: '', email: '', phone: '', street: '', city: '', state: '', zip: '', payment: 'cod', notes: '' }

export default function Checkout() {
  const { cart, cartTotal, clearCart, navigate } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const shipping = cartTotal >= 75 ? 0 : 8.99
  const total = cartTotal + shipping

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (!form.street.trim()) e.street = 'Street address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.zip.trim()) e.zip = 'ZIP code is required'
    return e
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const orderData = {
      id: `FT-${Date.now().toString(36).toUpperCase()}`,
      customer: form,
      items: cart,
      subtotal: cartTotal,
      shipping,
      total,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    }

    clearCart()
    navigate('order-success', orderData)
  }

  const fieldProps = { form, errors, onChange: update }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('cart')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" name="name" placeholder="Jane Smith" span2 {...fieldProps} />
                <Field label="Email Address" name="email" type="email" placeholder="jane@example.com" {...fieldProps} />
                <Field label="Phone Number" name="phone" type="tel" placeholder="+1 (555) 000-0000" {...fieldProps} />
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street Address" name="street" placeholder="123 Main Street, Apt 4B" span2 {...fieldProps} />
                <Field label="City" name="city" placeholder="New York" {...fieldProps} />
                <Field label="State" name="state" placeholder="NY" {...fieldProps} />
                <Field label="ZIP Code" name="zip" placeholder="10001" {...fieldProps} />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', Icon: Truck },
                  { value: 'card', label: 'Pay with Card', sub: 'Secure online payment', Icon: CreditCard },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      form.payment === opt.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={form.payment === opt.value}
                      onChange={() => update('payment', opt.value)}
                      className="accent-indigo-600"
                    />
                    <opt.Icon className={`w-5 h-5 ${form.payment === opt.value ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm font-medium ${form.payment === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              {form.payment === 'card' && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-amber-700 text-sm">
                    Card details will be collected securely at the time of delivery confirmation.
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                rows={3}
                placeholder="Any special delivery instructions..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.key} className="flex gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${item.product.colorFrom}, ${item.product.colorTo})`,
                      }}
                    >
                      <span className="text-white/50 text-xs select-none">◈</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.size} · {item.color} · x{item.qty}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-gray-900 flex-shrink-0">
                      ${(item.product.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600 text-lg">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Place Order
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">🔒 Your data is secure and encrypted</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
