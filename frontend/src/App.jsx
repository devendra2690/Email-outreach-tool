import { AppProvider, useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'

function PageRenderer() {
  const { page } = useApp()
  switch (page) {
    case 'home':           return <Home />
    case 'products':       return <Products />
    case 'product-detail': return <ProductDetail />
    case 'cart':           return <Cart />
    case 'checkout':       return <Checkout />
    case 'order-success':  return <OrderSuccess />
    default:               return <Home />
  }
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1">
          <PageRenderer />
        </main>
        <Footer />
      </div>
    </AppProvider>
  )
}
