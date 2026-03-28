import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getCatalogReturnSearch } from '../lib/catalogReturnStorage'

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export function CartPage() {
  const navigate = useNavigate()
  const { lines, orderTotal, lineSubtotal, setQuantity, removeLine } = useCart()

  function continueShopping() {
    const search = getCatalogReturnSearch()
    navigate({ pathname: '/', search: search || undefined })
  }

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-3">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Shopping cart
          </li>
        </ol>
      </nav>

      <section className="card border-0 shadow">
        <div className="card-header bg-white border-bottom py-4 px-4">
          <h1 className="h3 mb-1 fw-semibold">Shopping cart</h1>
          <p className="text-muted small mb-0">
            Adjust quantities or remove lines. Subtotals and the order total update
            automatically.
          </p>
        </div>
        <div className="card-body p-4 p-lg-4">
          {lines.length === 0 ? (
            <p className="text-muted mb-4">Your cart is empty.</p>
          ) : (
            <div className="table-responsive rounded border mb-4">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col" className="text-end">
                      Price
                    </th>
                    <th scope="col" className="text-end" style={{ width: '8rem' }}>
                      Qty
                    </th>
                    <th scope="col" className="text-end">
                      Subtotal
                    </th>
                    <th scope="col" className="text-end" style={{ width: '5rem' }}>
                      <span className="visually-hidden">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.bookId}>
                      <td className="fw-medium">{l.title}</td>
                      <td className="text-end font-monospace small">{money(l.price)}</td>
                      <td className="text-end">
                        <input
                          type="number"
                          min={1}
                          className="form-control form-control-sm text-end"
                          style={{ maxWidth: '5rem', marginLeft: 'auto' }}
                          value={l.quantity}
                          onChange={(e) => {
                            const n = Number.parseInt(e.target.value, 10)
                            if (Number.isFinite(n)) setQuantity(l.bookId, n)
                          }}
                        />
                      </td>
                      <td className="text-end fw-semibold text-success">
                        {money(lineSubtotal(l))}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeLine(l.bookId)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="row justify-content-end">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="border rounded p-3 bg-body-tertiary">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fs-5 fw-semibold">Total</span>
                  <span className="fs-4 fw-bold text-success">{money(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={continueShopping}
            >
              Continue shopping
            </button>
            <Link to="/" className="btn btn-outline-secondary">
              Back to catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
