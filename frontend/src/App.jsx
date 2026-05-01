import { AppProvider, useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Admin from './pages/Admin'

function PageRenderer() {
  const { page } = useApp()
  if (page === 'admin') return <Admin />
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {page === 'home'           && <Home />}
        {page === 'products'       && <Products />}
        {page === 'product-detail' && <ProductDetail />}
        {page === 'cart'           && <Cart />}
        {page === 'checkout'       && <Checkout />}
        {page === 'order-success'  && <OrderSuccess />}
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <PageRenderer />
      </div>
    </AppProvider>
  )
}
