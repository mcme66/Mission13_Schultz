import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://mission13schultzbackend-atfmeze5fxaretaf.mexicocentral-01.azurewebsites.net'

type FormFields = {
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: string
  price: string
}

const emptyForm: FormFields = {
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  classification: '',
  category: '',
  pageCount: '',
  price: '',
}

function validateClient(form: FormFields): Record<string, string> {
  const e: Record<string, string> = {}
  const req = (key: keyof FormFields, label: string) => {
    const v = form[key].trim()
    if (!v) e[key] = `${label} is required.`
  }

  req('title', 'Title')
  req('author', 'Author')
  req('publisher', 'Publisher')
  req('isbn', 'ISBN')
  req('classification', 'Classification')
  req('category', 'Category')

  const isbn = form.isbn.trim()
  if (isbn && isbn.length < 10)
    e.isbn = 'ISBN must be at least 10 characters.'
  if (isbn && !/^[\d\-Xx]+$/.test(isbn))
    e.isbn = 'ISBN may only contain digits, hyphens, or X.'

  const pages = form.pageCount.trim()
  if (!pages) e.pageCount = 'Page count is required.'
  else if (!/^\d+$/.test(pages)) e.pageCount = 'Enter a whole number for page count.'
  else {
    const n = Number.parseInt(pages, 10)
    if (n < 1 || n > 1_000_000)
      e.pageCount = 'Page count must be between 1 and 1,000,000.'
  }

  const priceStr = form.price.trim()
  if (!priceStr) e.price = 'Price is required.'
  else {
    const p = Number.parseFloat(priceStr)
    if (!Number.isFinite(p) || p <= 0 || p > 1_000_000)
      e.price = 'Enter a price between $0.01 and $1,000,000.'
  }

  return e
}

function mapServerErrors(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const o = body as { errors?: Record<string, string[]>; title?: string }
  if (o.errors) {
    const first = Object.values(o.errors).flat()[0]
    if (first) return first
  }
  if (typeof o.title === 'string') return o.title
  return null
}

/** Maps ASP.NET model-state keys to form field names. */
const serverKeyToField: Record<string, keyof FormFields> = {
  Title: 'title',
  Author: 'author',
  Publisher: 'publisher',
  ISBN: 'isbn',
  Classification: 'classification',
  Category: 'category',
  PageCount: 'pageCount',
  Price: 'price',
}

export function AddBookPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormFields>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const setField = (key: keyof FormFields, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((err) => {
      const next = { ...err }
      delete next[key]
      return next
    })
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setSubmitError(null)

    const clientErr = validateClient(form)
    setFieldErrors(clientErr)
    if (Object.keys(clientErr).length > 0) return

    const pageCount = Number.parseInt(form.pageCount.trim(), 10)
    const price = Number.parseFloat(form.price.trim())

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/Books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          author: form.author.trim(),
          publisher: form.publisher.trim(),
          isbn: form.isbn.trim(),
          classification: form.classification.trim(),
          category: form.category.trim(),
          pageCount,
          price,
        }),
      })

      if (res.status === 201) {
        navigate('/', { replace: true, state: { bookAdded: true } })
        return
      }

      const body = await res.json().catch(() => null)
      if (res.status === 400 && body?.errors) {
        const serverMsg = mapServerErrors(body)
        setSubmitError(serverMsg ?? 'Please fix the highlighted fields.')
        const errs: Record<string, string> = {}
        const raw = body.errors as Record<string, string[]>
        for (const [k, msgs] of Object.entries(raw)) {
          const shortName = k.includes('.') ? k.split('.').pop()! : k
          const field = serverKeyToField[shortName] ?? serverKeyToField[k]
          if (msgs?.[0] && field) errs[field] = msgs[0]
        }
        if (Object.keys(errs).length > 0) setFieldErrors((prev) => ({ ...prev, ...errs }))
      } else {
        setSubmitError(`Could not save (${res.status}). Try again.`)
      }
    } catch {
      setSubmitError('Could not reach the API. Is the backend running?')
    } finally {
      setSubmitting(false)
    }
  }

  const invalid = (name: keyof FormFields) =>
    fieldErrors[name] ? 'is-invalid' : ''

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-3">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Add a book
          </li>
        </ol>
      </nav>

      <section className="card border-0 shadow">
        <div className="card-header bg-white border-bottom py-4 px-4">
          <h1 className="h3 mb-1 fw-semibold">Add a book</h1>
          <p className="text-muted small mb-0">
            All fields are required. Entries are checked in the browser and on the
            server before saving to the database.
          </p>
        </div>
        <div className="card-body p-4 p-lg-5">
          {submitError && (
            <div className="alert alert-danger" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="row g-4">
              <div className="col-12">
                <label htmlFor="title" className="form-label fw-medium">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  className={`form-control ${invalid('title')}`}
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  autoComplete="off"
                  disabled={submitting}
                />
                {fieldErrors.title && (
                  <div className="invalid-feedback d-block">{fieldErrors.title}</div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="author" className="form-label fw-medium">
                  Author
                </label>
                <input
                  id="author"
                  type="text"
                  className={`form-control ${invalid('author')}`}
                  value={form.author}
                  onChange={(e) => setField('author', e.target.value)}
                  autoComplete="off"
                  disabled={submitting}
                />
                {fieldErrors.author && (
                  <div className="invalid-feedback d-block">{fieldErrors.author}</div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="publisher" className="form-label fw-medium">
                  Publisher
                </label>
                <input
                  id="publisher"
                  type="text"
                  className={`form-control ${invalid('publisher')}`}
                  value={form.publisher}
                  onChange={(e) => setField('publisher', e.target.value)}
                  autoComplete="off"
                  disabled={submitting}
                />
                {fieldErrors.publisher && (
                  <div className="invalid-feedback d-block">
                    {fieldErrors.publisher}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="isbn" className="form-label fw-medium">
                  ISBN
                </label>
                <input
                  id="isbn"
                  type="text"
                  className={`form-control font-monospace ${invalid('isbn')}`}
                  value={form.isbn}
                  onChange={(e) => setField('isbn', e.target.value)}
                  placeholder="e.g. 978-0451419439"
                  autoComplete="off"
                  disabled={submitting}
                />
                {fieldErrors.isbn && (
                  <div className="invalid-feedback d-block">{fieldErrors.isbn}</div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="classification" className="form-label fw-medium">
                  Classification
                </label>
                <input
                  id="classification"
                  type="text"
                  className={`form-control ${invalid('classification')}`}
                  value={form.classification}
                  onChange={(e) => setField('classification', e.target.value)}
                  placeholder="e.g. Fiction, Non-Fiction"
                  autoComplete="off"
                  disabled={submitting}
                />
                {fieldErrors.classification && (
                  <div className="invalid-feedback d-block">
                    {fieldErrors.classification}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="category" className="form-label fw-medium">
                  Category
                </label>
                <input
                  id="category"
                  type="text"
                  className={`form-control ${invalid('category')}`}
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  placeholder="e.g. Classic, Biography"
                  autoComplete="off"
                  disabled={submitting}
                />
                {fieldErrors.category && (
                  <div className="invalid-feedback d-block">{fieldErrors.category}</div>
                )}
              </div>

              <div className="col-md-3 col-6">
                <label htmlFor="pageCount" className="form-label fw-medium">
                  Number of pages
                </label>
                <input
                  id="pageCount"
                  type="number"
                  min={1}
                  step={1}
                  className={`form-control ${invalid('pageCount')}`}
                  value={form.pageCount}
                  onChange={(e) => setField('pageCount', e.target.value)}
                  disabled={submitting}
                />
                {fieldErrors.pageCount && (
                  <div className="invalid-feedback d-block">
                    {fieldErrors.pageCount}
                  </div>
                )}
              </div>

              <div className="col-md-3 col-6">
                <label htmlFor="price" className="form-label fw-medium">
                  Price (USD)
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    id="price"
                    type="number"
                    min={0.01}
                    step={0.01}
                    className={`form-control ${invalid('price')}`}
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                {fieldErrors.price && (
                  <div className="invalid-feedback d-block">{fieldErrors.price}</div>
                )}
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-5 pt-3 border-top">
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Saving…
                  </>
                ) : (
                  'Add book'
                )}
              </button>
              <Link to="/" className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
