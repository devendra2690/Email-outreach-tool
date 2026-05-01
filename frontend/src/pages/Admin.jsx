import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/products'
import { Plus, Pencil, Trash2, LogOut, X, Save, ShieldCheck, Eye } from 'lucide-react'

const BADGES = ['', 'Bestseller', 'New Arrival', 'Sale', 'Premium']

const COLOR_THEMES = [
  { label: 'Deep Blue',   colorFrom: '#475569', colorTo: '#1e3a5f' },
  { label: 'Brown',       colorFrom: '#a0845c', colorTo: '#6b4f32' },
  { label: 'Slate Grey',  colorFrom: '#6b7280', colorTo: '#374151' },
  { label: 'Dark Navy',   colorFrom: '#1e3a8a', colorTo: '#0f172a' },
  { label: 'Rose Pink',   colorFrom: '#f9a8d4', colorTo: '#db2777' },
  { label: 'Indigo',      colorFrom: '#4f46e5', colorTo: '#312e81' },
  { label: 'Burgundy',    colorFrom: '#9f1239', colorTo: '#881337' },
  { label: 'Peach',       colorFrom: '#fed7aa', colorTo: '#ea580c' },
  { label: 'Sage Green',  colorFrom: '#4ade80', colorTo: '#166534' },
  { label: 'Sky Blue',    colorFrom: '#60a5fa', colorTo: '#1d4ed8' },
  { label: 'Amber',       colorFrom: '#fbbf24', colorTo: '#d97706' },
  { label: 'Purple',      colorFrom: '#a78bfa', colorTo: '#7c3aed' },
  { label: 'Dark Brown',  colorFrom: '#92400e', colorTo: '#451a03' },
  { label: 'Gold',        colorFrom: '#f59e0b', colorTo: '#b45309' },
  { label: 'Warm Grey',   colorFrom: '#d6d3d1', colorTo: '#78716c' },
]

const EMPTY_FORM = {
  name: '', category: "Men's", price: '', originalPrice: '',
  description: '', care: '', sizes: '', colors: '',
  badge: '', colorFrom: '#475569', colorTo: '#1e3a5f',
}

function ProductImage({ colorFrom, colorTo, name }) {
  return (
    <div
      className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
    >
      <span className="text-white/40 text-lg select-none">◈</span>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    if (!onLogin(password)) {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Pravin Fashion — Product Manager</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              placeholder="Enter admin password"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">Incorrect password. Try again.</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = () => {
    if (!form.name.trim() || !form.price) return alert('Product name and price are required.')
    onSave({
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      badge: form.badge || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {initial ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Cotton Kurta"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Category & Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge (Optional)</label>
              <select
                value={form.badge}
                onChange={e => set('badge', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="e.g. 1499"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (₹) <span className="text-gray-400 font-normal">— for Sale badge</span>
              </label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={e => set('originalPrice', e.target.value)}
                placeholder="e.g. 1999 (optional)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Sizes & Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
              <input
                value={form.sizes}
                onChange={e => set('sizes', e.target.value)}
                placeholder="S, M, L, XL, XXL"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
              <input
                value={form.colors}
                onChange={e => set('colors', e.target.value)}
                placeholder="Red, Blue, Black"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Describe your product..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Care */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
            <input
              value={form.care}
              onChange={e => set('care', e.target.value)}
              placeholder="e.g. Machine wash cold. Hang dry."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Card Color Theme</label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_THEMES.map(theme => (
                <button
                  key={theme.label}
                  type="button"
                  onClick={() => { set('colorFrom', theme.colorFrom); set('colorTo', theme.colorTo) }}
                  className={`relative h-10 rounded-lg transition-all ${
                    form.colorFrom === theme.colorFrom
                      ? 'ring-2 ring-offset-2 ring-indigo-600 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${theme.colorFrom}, ${theme.colorTo})` }}
                  title={theme.label}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Choose the background colour for this product's card</p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Product
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const { isAdmin, adminLogin, adminLogout, products, addProduct, updateProduct, deleteProduct, navigate } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  if (!isAdmin) return <LoginScreen onLogin={adminLogin} />

  const handleAdd = (data) => {
    addProduct(data)
    setShowForm(false)
  }

  const handleEdit = (data) => {
    updateProduct(editingProduct.id, data)
    setEditingProduct(null)
  }

  const handleDelete = (id) => {
    deleteProduct(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Manager</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products in your store</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" /> View Store
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button
            onClick={adminLogout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Badge</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <ProductImage colorFrom={product.colorFrom} colorTo={product.colorTo} />
                    <span className="font-medium text-gray-900 text-sm">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className="text-sm text-gray-500">{product.category}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through ml-1">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  {product.badge ? (
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full">
                      {product.badge}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingProduct({
                        ...product,
                        sizes: product.sizes.join(', '),
                        colors: product.colors.join(', '),
                        badge: product.badge || '',
                        originalPrice: product.originalPrice || '',
                      })}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Form */}
      {showForm && (
        <ProductForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* Edit Form */}
      {editingProduct && (
        <ProductForm initial={editingProduct} onSave={handleEdit} onCancel={() => setEditingProduct(null)} />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
