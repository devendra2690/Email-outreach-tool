import { createContext, useContext, useReducer, useState, useEffect } from 'react'
import { products as defaultProducts } from '../data/products'

const AppContext = createContext(null)

const STORAGE_KEY = 'pravin_fashion_products'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'pravin@2024'

const PATH_TO_PAGE = {
  '/': 'home',
  '/shop': 'products',
  '/cart': 'cart',
  '/checkout': 'checkout',
  '/admin': 'admin',
  '/product': 'product-detail',
  '/order-confirmed': 'order-success',
}

const PAGE_TO_PATH = {
  'home': '/',
  'products': '/shop',
  'cart': '/cart',
  'checkout': '/checkout',
  'admin': '/admin',
  'product-detail': '/product',
  'order-success': '/order-confirmed',
}

function getInitialPage() {
  const path = window.location.pathname
  return PATH_TO_PAGE[path] || 'home'
}

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultProducts
  } catch {
    return defaultProducts
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = `${action.product.id}-${action.size}-${action.color}`
      const existing = state.find(i => i.key === key)
      if (existing) {
        return state.map(i => i.key === key ? { ...i, qty: i.qty + action.qty } : i)
      }
      return [...state, { key, product: action.product, size: action.size, color: action.color, qty: action.qty }]
    }
    case 'REMOVE_ITEM':
      return state.filter(i => i.key !== action.key)
    case 'UPDATE_QTY':
      return state.map(i => i.key === action.key ? { ...i, qty: action.qty } : i)
    case 'CLEAR_CART':
      return []
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [page, setPage] = useState(getInitialPage)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [order, setOrder] = useState(null)
  const [cart, dispatch] = useReducer(cartReducer, [])
  const [products, setProducts] = useState(loadProducts)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => { saveProducts(products) }, [products])

  useEffect(() => {
    const handlePopState = () => {
      const p = PATH_TO_PAGE[window.location.pathname] || 'home'
      setPage(p)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (newPage, data = null) => {
    if (newPage === 'product-detail') setSelectedProduct(data)
    if (newPage === 'order-success') setOrder(data)
    setPage(newPage)
    const path = PAGE_TO_PATH[newPage] || '/'
    window.history.pushState({}, '', path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const adminLogin = (password) => {
    if (password === ADMIN_PASSWORD) { setIsAdmin(true); return true }
    return false
  }
  const adminLogout = () => setIsAdmin(false)

  const addProduct = (product) => {
    const id = Date.now()
    setProducts(prev => [...prev, { ...product, id }])
  }

  const updateProduct = (id, updated) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const addToCart = (product, size, color, qty = 1) =>
    dispatch({ type: 'ADD_ITEM', product, size, color, qty })

  const removeFromCart = key => dispatch({ type: 'REMOVE_ITEM', key })
  const updateQty = (key, qty) => dispatch({ type: 'UPDATE_QTY', key, qty })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0)

  return (
    <AppContext.Provider value={{
      page, navigate,
      selectedProduct,
      order,
      products,
      cart, cartCount, cartTotal,
      addToCart, removeFromCart, updateQty, clearCart,
      isAdmin, adminLogin, adminLogout,
      addProduct, updateProduct, deleteProduct,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
