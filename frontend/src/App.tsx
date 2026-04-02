import { Link, Route, Routes } from 'react-router-dom'
import { CartSummary } from './components/CartSummary'
import { CartProvider, useCart } from './context/CartContext'
import { AddBookPage } from './pages/AddBookPage'
import { AdminBooksPage } from './pages/AdminBooksPage'
import { CartPage } from './pages/CartPage'
import { HomePage } from './pages/HomePage'

function NavCartBadge() {
  const { totalQuantity } = useCart()
  if (totalQuantity <= 0) return null
  return (
    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
      {totalQuantity > 99 ? '99+' : totalQuantity}
      <span className="visually-hidden">items in cart</span>
    </span>
  )
}

function AppShell() {
  return (
    <div className="min-vh-100 d-flex flex-column bg-body-secondary">
      <nav className="navbar navbar-dark bg-primary shadow-sm">
        <div className="container d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <Link
            to="/"
            className="navbar-brand fw-semibold text-white text-decoration-none mb-0"
          >
            Booksmith
          </Link>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <button
              type="button"
              className="btn btn-light btn-sm fw-semibold d-lg-none position-relative"
              data-bs-toggle="offcanvas"
              data-bs-target="#cartOffcanvas"
              aria-controls="cartOffcanvas"
            >
              Cart
              <NavCartBadge />
            </button>
            <Link
              to="/cart"
              className="btn btn-light btn-sm fw-semibold px-3 d-none d-lg-inline-flex align-items-center gap-2 position-relative"
            >
              Cart
              <NavCartBadge />
            </Link>
            <Link to="/extra" className="btn btn-outline-light btn-sm fw-semibold px-3">
              Add book
            </Link>
            <Link to="/adminbooks" className="btn btn-outline-light btn-sm fw-semibold px-3">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1 py-4 py-lg-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-xxl-11">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/extra" element={<AddBookPage />} />
                <Route path="/adminbooks" element={<AdminBooksPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </main>

      <div
        className="offcanvas offcanvas-end"
        tabIndex={-1}
        id="cartOffcanvas"
        aria-labelledby="cartOffcanvasLabel"
      >
        <div className="offcanvas-header border-bottom">
          <h2 className="offcanvas-title h5 mb-0" id="cartOffcanvasLabel">
            Cart summary
          </h2>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <CartSummary compact />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  )
}

export default App
