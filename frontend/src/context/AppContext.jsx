import { createContext, useContext, useReducer, useState } from 'react'

const AppContext = createContext(null)

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
  const [page, setPage] = useState('home')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [order, setOrder] = useState(null)
  const [cart, dispatch] = useReducer(cartReducer, [])

  const navigate = (newPage, data = null) => {
    if (newPage === 'product-detail') setSelectedProduct(data)
    if (newPage === 'order-success') setOrder(data)
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      cart, cartCount, cartTotal,
      addToCart, removeFromCart, updateQty, clearCart,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
