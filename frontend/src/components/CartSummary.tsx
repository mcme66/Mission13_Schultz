import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

type Props = {
  /** When true, show a compact layout for the offcanvas panel */
  compact?: boolean
}

export function CartSummary({ compact = false }: Props) {
  const { lines, totalQuantity, orderTotal } = useCart()

  if (lines.length === 0) {
    return (
      <div className={compact ? '' : 'card border-0 shadow-sm h-100'}>
        {!compact && (
          <div className="card-header bg-white border-bottom py-3">
            <h2 className="h5 mb-0 fw-semibold">Cart summary</h2>
          </div>
        )}
        <div className={compact ? 'p-3' : 'card-body p-4'}>
          <p className="text-muted small mb-0">Your cart is empty. Add books from the catalog.</p>
          <Link to="/cart" className="btn btn-outline-primary btn-sm mt-3">
            View cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'card border-0 shadow-sm h-100'}>
      {!compact && (
        <div className="card-header bg-white border-bottom py-3">
          <h2 className="h5 mb-0 fw-semibold">Cart summary</h2>
          <p className="text-muted small mb-0 mt-1">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
          </p>
        </div>
      )}
      <div className={compact ? 'p-3' : 'card-body p-4'}>
        {compact && (
          <p className="small text-muted mb-2">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
          </p>
        )}
        <ul className={`list-group list-group-flush ${compact ? 'mb-2' : 'mb-3'}`}>
          {lines.slice(0, compact ? 5 : lines.length).map((l) => (
            <li
              key={l.bookId}
              className="list-group-item px-0 d-flex justify-content-between align-items-start gap-2 border-light-subtle"
            >
              <span className="small text-truncate" title={l.title}>
                {l.title}
              </span>
              <span className="small text-nowrap text-muted">
                ×{l.quantity} · {money(l.price * l.quantity)}
              </span>
            </li>
          ))}
          {compact && lines.length > 5 && (
            <li className="list-group-item px-0 border-0 small text-muted">
              +{lines.length - 5} more…
            </li>
          )}
        </ul>
        <div className="d-flex justify-content-between align-items-baseline border-top pt-3">
          <span className="fw-semibold">Total</span>
          <span className="fs-5 fw-bold text-success">{money(orderTotal)}</span>
        </div>
        <div className="d-grid gap-2 mt-3">
          <Link to="/cart" className="btn btn-primary">
            View cart
          </Link>
        </div>
      </div>
    </div>
  )
}
