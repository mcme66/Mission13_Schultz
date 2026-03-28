import { useLocation, useNavigate } from 'react-router-dom'
import { BookList } from '../components/BookList'
import { CartSummary } from '../components/CartSummary'

export function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const showSuccess = !!(location.state as { bookAdded?: boolean } | null)?.bookAdded

  function dismissSuccess() {
    navigate('.', { replace: true, state: {} })
  }

  return (
    <>
      {showSuccess && (
        <div className="row mb-3">
          <div className="col-12">
            <div
              className="alert alert-success alert-dismissible shadow-sm mb-0"
              role="alert"
            >
              <strong>Success.</strong> The book was added to the collection.
              <button
                type="button"
                className="btn-close"
                aria-label="Dismiss"
                onClick={dismissSuccess}
              />
            </div>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <header className="card border-0 shadow-sm overflow-hidden">
            <div className="card-body p-4 p-lg-5 bg-primary bg-gradient text-white">
              <p className="text-white-50 text-uppercase small fw-semibold mb-2 letter-spacing">
                Mission 12 · ASP.NET Core &amp; React
              </p>
              <h1 className="display-6 fw-bold mb-3">Online bookstore</h1>
              <p className="lead mb-0 text-white-50 col-lg-10">
                Browse titles from the SQLite database with pagination, filter by
                category, sort by title, and add books to your cart. Your cart
                persists for this browser session as you move around the site.
              </p>
            </div>
          </header>
        </div>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-lg-8">
          <BookList />
        </div>
        <div className="col-12 col-lg-4">
          <div className="sticky-lg-top" style={{ top: '1rem' }}>
            <CartSummary />
          </div>
        </div>
      </div>
    </>
  )
}
