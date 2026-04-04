import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Toast } from 'bootstrap'
import { useCart } from '../context/CartContext'
import { saveCatalogReturnSearch } from '../lib/catalogReturnStorage'

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://mission13schultzbackend-atfmeze5fxaretaf.mexicocentral-01.azurewebsites.net'

export type Book = {
  bookID: number
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: number
  price: number
}

type PagedBooksResponse = {
  books: Book[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

function classificationBadgeClass(classification: string): string {
  const c = classification.toLowerCase()
  if (c.includes('non-fiction') || c.includes('nonfiction'))
    return 'text-bg-secondary'
  if (c.includes('fiction')) return 'text-bg-primary'
  return 'text-bg-dark'
}

function parsePage(params: URLSearchParams): number {
  const v = Number(params.get('page'))
  return Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1
}

function parsePageSize(params: URLSearchParams): number {
  const v = Number(params.get('pageSize'))
  return PAGE_SIZE_OPTIONS.includes(v as (typeof PAGE_SIZE_OPTIONS)[number])
    ? v
    : 5
}

function parseSort(params: URLSearchParams): 'asc' | 'desc' {
  return params.get('sortOrder') === 'desc' ? 'desc' : 'asc'
}

function parseCategory(params: URLSearchParams): string {
  return params.get('category')?.trim() ?? ''
}

export function BookList() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addItem } = useCart()
  const toastRef = useRef<HTMLDivElement | null>(null)
  const [toastTitle, setToastTitle] = useState('')

  const page = useMemo(() => parsePage(searchParams), [searchParams])
  const pageSize = useMemo(() => parsePageSize(searchParams), [searchParams])
  const sortOrder = useMemo(() => parseSort(searchParams), [searchParams])
  const category = useMemo(() => parseCategory(searchParams), [searchParams])

  const [categories, setCategories] = useState<string[]>([])
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [data, setData] = useState<PagedBooksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/Books/categories`)
        if (!res.ok) {
          if (!cancelled) setCategoriesError(`Categories request failed (${res.status})`)
          return
        }
        const json: unknown = await res.json()
        if (!cancelled && Array.isArray(json))
          setCategories(json.filter((x): x is string => typeof x === 'string'))
      } catch {
        if (!cancelled) setCategoriesError('Could not load categories.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const patchParams = useCallback(
    (
      patch: Partial<{
        page: number
        pageSize: number
        sortOrder: 'asc' | 'desc'
        category: string
      }>,
    ) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev)
          if (patch.page !== undefined) n.set('page', String(patch.page))
          if (patch.pageSize !== undefined) n.set('pageSize', String(patch.pageSize))
          if (patch.sortOrder !== undefined) n.set('sortOrder', patch.sortOrder)
          if (patch.category !== undefined) {
            const c = patch.category.trim()
            if (c === '') n.delete('category')
            else n.set('category', c)
          }
          return n
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortOrder,
    })
    if (category) params.set('category', category)
    try {
      const res = await fetch(`${API_BASE}/api/Books?${params}`)
      if (!res.ok) {
        setError(`Request failed (${res.status})`)
        setData(null)
        return
      }
      const json: PagedBooksResponse = await res.json()
      setData(json)
      if (json.page !== page) {
        patchParams({ page: json.page })
      }
    } catch {
      setError('Could not reach the API. Is the backend running?')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortOrder, category, patchParams])

  useEffect(() => {
    void load()
  }, [load])

  function showAddedToast(title: string) {
    setToastTitle(title)
    const el = toastRef.current
    if (el) Toast.getOrCreateInstance(el, { autohide: true, delay: 3200 }).show()
  }

  function handleAddToCart(book: Book) {
    saveCatalogReturnSearch(location.search)
    addItem({
      bookID: book.bookID,
      title: book.title,
      price: book.price,
    })
    showAddedToast(book.title)
  }

  const totalPages = data?.totalPages ?? 0

  return (
    <>
      <section className="card border-0 shadow" aria-labelledby="catalog-heading">
        <div className="card-header bg-white border-bottom py-3 px-4 px-lg-4">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
            <div>
              <h2 id="catalog-heading" className="h4 mb-1 fw-semibold">
                Catalog
              </h2>
              <p className="text-muted small mb-0">
                Filter by category, sort, and page through books.
              </p>
            </div>
            {data && (
              <div className="d-flex flex-wrap gap-2">
                <span className="badge rounded-pill text-bg-primary px-3 py-2">
                  {data.totalCount} titles
                </span>
                <span className="badge rounded-pill text-bg-light text-dark border px-3 py-2">
                  Page {data.page} / {Math.max(totalPages, 1)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="card-body p-4 p-lg-4">
          {categoriesError && (
            <div className="alert alert-warning py-2 small mb-3" role="alert">
              {categoriesError}
            </div>
          )}

          <div className="row g-3 align-items-end mb-4">
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label className="form-label fw-medium small mb-1" htmlFor="categoryFilter">
                Category
              </label>
              <select
                id="categoryFilter"
                className="form-select"
                value={category}
                onChange={(e) => {
                  patchParams({ category: e.target.value, page: 1 })
                }}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label className="form-label fw-medium small mb-1" htmlFor="sortOrder">
                Sort by title
              </label>
              <select
                id="sortOrder"
                className="form-select"
                value={sortOrder}
                onChange={(e) => {
                  patchParams({
                    sortOrder: e.target.value as 'asc' | 'desc',
                    page: 1,
                  })
                }}
              >
                <option value="asc">A → Z</option>
                <option value="desc">Z → A</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label className="form-label fw-medium small mb-1" htmlFor="pageSize">
                Books per page
              </label>
              <select
                id="pageSize"
                className="form-select"
                value={pageSize}
                onChange={(e) => {
                  patchParams({ pageSize: Number(e.target.value), page: 1 })
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div
              className="rounded border p-4"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <p className="visually-hidden">Loading books…</p>
              <div className="placeholder-glow">
                <span className="placeholder col-12 mb-2" />
                <span className="placeholder col-10 mb-2" />
                <span className="placeholder col-8 mb-4" />
                <span className="placeholder col-12 mb-1" />
                <span className="placeholder col-12 mb-1" />
                <span className="placeholder col-12 mb-1" />
              </div>
              <div className="d-flex justify-content-center mt-4">
                <div className="spinner-border text-primary" aria-hidden="true" />
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-warning d-flex align-items-start gap-2 mb-0" role="alert">
              <span className="fw-semibold">Heads up.</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && data && (
            <>
              <div className="table-responsive rounded border">
                <table className="table table-hover table-striped table-sm align-middle mb-0">
                  <caption className="text-muted small px-3 pt-2 pb-0">
                    Showing {data.books.length} of {data.totalCount} books (sorted by title
                    {category ? ` · category: ${category}` : ''}).
                  </caption>
                  <thead className="table-dark">
                    <tr>
                      <th scope="col">Title</th>
                      <th scope="col">Author</th>
                      <th scope="col">Publisher</th>
                      <th scope="col">ISBN</th>
                      <th scope="col">Classification</th>
                      <th scope="col">Category</th>
                      <th scope="col" className="text-end">
                        Pages
                      </th>
                      <th scope="col" className="text-end">
                        Price
                      </th>
                      <th scope="col" className="text-end">
                        Cart
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.books.map((b) => (
                      <tr key={b.bookID}>
                        <td className="fw-medium">{b.title}</td>
                        <td>{b.author}</td>
                        <td className="text-muted small">{b.publisher}</td>
                        <td>
                          <code className="small text-body-secondary">{b.isbn}</code>
                        </td>
                        <td>
                          <span
                            className={`badge ${classificationBadgeClass(b.classification)}`}
                          >
                            {b.classification}
                          </span>
                        </td>
                        <td>
                          <span className="badge text-bg-info text-dark">{b.category}</span>
                        </td>
                        <td className="text-end font-monospace small">
                          {b.pageCount.toLocaleString()}
                        </td>
                        <td className="text-end">
                          <span className="fw-semibold text-success">
                            {b.price.toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'USD',
                            })}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleAddToCart(b)}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mt-4 pt-3 border-top">
                <p className="small text-muted mb-0">
                  <span className="fw-medium text-body">Results:</span> page {data.page} of{' '}
                  {Math.max(totalPages, 1)} · {data.totalCount} books total
                </p>
                <nav aria-label="Book pagination">
                  <ul className="pagination pagination-sm mb-0 flex-wrap justify-content-center">
                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link rounded-start"
                        onClick={() => patchParams({ page: Math.max(1, page - 1) })}
                        disabled={page <= 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <li key={n} className={`page-item ${n === page ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => patchParams({ page: n })}
                          aria-current={n === page ? 'page' : undefined}
                        >
                          {n}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${page >= totalPages || totalPages === 0 ? 'disabled' : ''}`}
                    >
                      <button
                        type="button"
                        className="page-link rounded-end"
                        onClick={() =>
                          patchParams({
                            page: totalPages ? Math.min(totalPages, page + 1) : page,
                          })
                        }
                        disabled={page >= totalPages || totalPages === 0}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
        <div
          id="addToCartToast"
          ref={toastRef}
          className="toast text-bg-success"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          data-bs-autohide="true"
          data-bs-delay="3200"
        >
          <div className="toast-header">
            <strong className="me-auto">Added to cart</strong>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="toast"
              aria-label="Close"
            />
          </div>
          <div className="toast-body">
            {toastTitle ? (
              <span className="text-break">{toastTitle}</span>
            ) : (
              <span>Item added.</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
