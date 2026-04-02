import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Book } from '../components/BookList'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5076'

type PagedBooksResponse = {
  books: Book[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

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

function formFromBook(b: Book): FormFields {
  return {
    title: b.title ?? '',
    author: b.author ?? '',
    publisher: b.publisher ?? '',
    isbn: b.isbn ?? '',
    classification: b.classification ?? '',
    category: b.category ?? '',
    pageCount: String(b.pageCount ?? ''),
    price: String(b.price ?? ''),
  }
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
  if (isbn && isbn.length < 10) e.isbn = 'ISBN must be at least 10 characters.'
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

export function AdminBooksPage() {
  const [data, setData] = useState<PagedBooksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const pageSize = 20
  const totalPages = data?.totalPages ?? 0

  const [addForm, setAddForm] = useState<FormFields>(emptyForm)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [addSubmitError, setAddSubmitError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormFields>(emptyForm)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const editingBook = useMemo(
    () => data?.books.find((b) => b.bookID === editingId) ?? null,
    [data, editingId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortOrder: 'asc',
    })
    try {
      const res = await fetch(`${API_BASE}/api/Books?${params}`)
      if (!res.ok) {
        setError(`Request failed (${res.status})`)
        setData(null)
        return
      }
      const json: PagedBooksResponse = await res.json()
      setData(json)
      if (json.page !== page) setPage(json.page)
    } catch {
      setError('Could not reach the API. Is the backend running?')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  async function deleteBook(id: number, title: string) {
    const ok = window.confirm(`Delete “${title}”? This cannot be undone.`)
    if (!ok) return
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/Books/${id}`, { method: 'DELETE' })
      if (res.status === 204) {
        if (editingId === id) {
          setEditingId(null)
          setEditForm(emptyForm)
          setEditErrors({})
          setEditSubmitError(null)
        }
        await load()
        return
      }
      setError(`Delete failed (${res.status}).`)
    } catch {
      setError('Could not reach the API to delete.')
    }
  }

  const invalid = (errs: Record<string, string>, name: keyof FormFields) =>
    errs[name] ? 'is-invalid' : ''

  const setFormField =
    (
      setter: React.Dispatch<React.SetStateAction<FormFields>>,
      errorSetter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    ) =>
    (key: keyof FormFields, value: string) => {
      setter((f) => ({ ...f, [key]: value }))
      errorSetter((err) => {
        const next = { ...err }
        delete next[key]
        return next
      })
    }

  const setAddField = useMemo(() => setFormField(setAddForm, setAddErrors), [])
  const setEditField = useMemo(() => setFormField(setEditForm, setEditErrors), [])

  async function onAdd(ev: FormEvent) {
    ev.preventDefault()
    setAddSubmitError(null)

    const clientErr = validateClient(addForm)
    setAddErrors(clientErr)
    if (Object.keys(clientErr).length > 0) return

    const pageCount = Number.parseInt(addForm.pageCount.trim(), 10)
    const price = Number.parseFloat(addForm.price.trim())

    setAdding(true)
    try {
      const res = await fetch(`${API_BASE}/api/Books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addForm.title.trim(),
          author: addForm.author.trim(),
          publisher: addForm.publisher.trim(),
          isbn: addForm.isbn.trim(),
          classification: addForm.classification.trim(),
          category: addForm.category.trim(),
          pageCount,
          price,
        }),
      })

      if (res.status === 201) {
        setAddForm(emptyForm)
        setAddErrors({})
        await load()
        return
      }

      const body = await res.json().catch(() => null)
      if (res.status === 400 && body?.errors) {
        const serverMsg = mapServerErrors(body)
        setAddSubmitError(serverMsg ?? 'Please fix the highlighted fields.')
        const errs: Record<string, string> = {}
        const raw = body.errors as Record<string, string[]>
        for (const [k, msgs] of Object.entries(raw)) {
          const shortName = k.includes('.') ? k.split('.').pop()! : k
          const field = serverKeyToField[shortName] ?? serverKeyToField[k]
          if (msgs?.[0] && field) errs[field] = msgs[0]
        }
        if (Object.keys(errs).length > 0)
          setAddErrors((prev) => ({ ...prev, ...errs }))
      } else {
        setAddSubmitError(`Could not save (${res.status}). Try again.`)
      }
    } catch {
      setAddSubmitError('Could not reach the API. Is the backend running?')
    } finally {
      setAdding(false)
    }
  }

  async function startEdit(b: Book) {
    setEditingId(b.bookID)
    setEditForm(formFromBook(b))
    setEditErrors({})
    setEditSubmitError(null)
  }

  async function cancelEdit() {
    setEditingId(null)
    setEditForm(emptyForm)
    setEditErrors({})
    setEditSubmitError(null)
  }

  async function onSaveEdit(ev: FormEvent) {
    ev.preventDefault()
    setEditSubmitError(null)

    if (!editingId) return

    const clientErr = validateClient(editForm)
    setEditErrors(clientErr)
    if (Object.keys(clientErr).length > 0) return

    const pageCount = Number.parseInt(editForm.pageCount.trim(), 10)
    const price = Number.parseFloat(editForm.price.trim())

    setSavingEdit(true)
    try {
      const res = await fetch(`${API_BASE}/api/Books/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          author: editForm.author.trim(),
          publisher: editForm.publisher.trim(),
          isbn: editForm.isbn.trim(),
          classification: editForm.classification.trim(),
          category: editForm.category.trim(),
          pageCount,
          price,
        }),
      })

      if (res.ok) {
        await load()
        await cancelEdit()
        return
      }

      const body = await res.json().catch(() => null)
      if (res.status === 400 && body?.errors) {
        const serverMsg = mapServerErrors(body)
        setEditSubmitError(serverMsg ?? 'Please fix the highlighted fields.')
        const errs: Record<string, string> = {}
        const raw = body.errors as Record<string, string[]>
        for (const [k, msgs] of Object.entries(raw)) {
          const shortName = k.includes('.') ? k.split('.').pop()! : k
          const field = serverKeyToField[shortName] ?? serverKeyToField[k]
          if (msgs?.[0] && field) errs[field] = msgs[0]
        }
        if (Object.keys(errs).length > 0)
          setEditErrors((prev) => ({ ...prev, ...errs }))
      } else if (res.status === 404) {
        setEditSubmitError('That book no longer exists (404). Refresh and try again.')
      } else {
        setEditSubmitError(`Could not save (${res.status}). Try again.`)
      }
    } catch {
      setEditSubmitError('Could not reach the API to save changes.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb mb-3">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Admin books
          </li>
        </ol>
      </nav>

      <header className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-lg-between gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1 fw-semibold">Admin: books</h1>
          <p className="text-muted small mb-0">Add, edit, and delete books in the database.</p>
        </div>
        {data && (
          <div className="d-flex flex-wrap gap-2">
            <span className="badge rounded-pill text-bg-primary px-3 py-2">
              {data.totalCount} total
            </span>
            <span className="badge rounded-pill text-bg-light text-dark border px-3 py-2">
              Page {data.page} / {Math.max(totalPages, 1)}
            </span>
          </div>
        )}
      </header>

      {error && (
        <div className="alert alert-warning d-flex align-items-start gap-2" role="alert">
          <span className="fw-semibold">Heads up.</span>
          <span>{error}</span>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <section className="card border-0 shadow">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h2 className="h5 mb-0 fw-semibold">Books</h2>
            </div>
            <div className="card-body p-0">
              {loading && (
                <div className="p-4" aria-busy="true" aria-live="polite">
                  <div className="d-flex align-items-center gap-2">
                    <div className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
                    <span className="text-muted">Loading…</span>
                  </div>
                </div>
              )}

              {!loading && data && (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th scope="col">Title</th>
                          <th scope="col">Author</th>
                          <th scope="col" className="text-end">
                            Price
                          </th>
                          <th scope="col" className="text-end">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.books.map((b) => (
                          <tr key={b.bookID}>
                            <td className="fw-medium">{b.title}</td>
                            <td>{b.author}</td>
                            <td className="text-end">
                              {b.price.toLocaleString(undefined, {
                                style: 'currency',
                                currency: 'USD',
                              })}
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm" role="group" aria-label="Admin actions">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  onClick={() => void startEdit(b)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => void deleteBook(b.bookID, b.title)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between gap-2 p-3 border-top">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </button>
                    <span className="small text-muted">
                      Page {data.page} of {Math.max(totalPages, 1)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p))}
                      disabled={page >= totalPages || totalPages === 0}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-5">
          <section className="card border-0 shadow mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h2 className="h5 mb-0 fw-semibold">Add a book</h2>
            </div>
            <div className="card-body p-4">
              {addSubmitError && (
                <div className="alert alert-danger" role="alert">
                  {addSubmitError}
                </div>
              )}

              <form onSubmit={onAdd} noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-medium" htmlFor="add-title">
                      Title
                    </label>
                    <input
                      id="add-title"
                      className={`form-control ${invalid(addErrors, 'title')}`}
                      value={addForm.title}
                      onChange={(e) => setAddField('title', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.title && <div className="invalid-feedback d-block">{addErrors.title}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium" htmlFor="add-author">
                      Author
                    </label>
                    <input
                      id="add-author"
                      className={`form-control ${invalid(addErrors, 'author')}`}
                      value={addForm.author}
                      onChange={(e) => setAddField('author', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.author && <div className="invalid-feedback d-block">{addErrors.author}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium" htmlFor="add-publisher">
                      Publisher
                    </label>
                    <input
                      id="add-publisher"
                      className={`form-control ${invalid(addErrors, 'publisher')}`}
                      value={addForm.publisher}
                      onChange={(e) => setAddField('publisher', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.publisher && (
                      <div className="invalid-feedback d-block">{addErrors.publisher}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium" htmlFor="add-isbn">
                      ISBN
                    </label>
                    <input
                      id="add-isbn"
                      className={`form-control font-monospace ${invalid(addErrors, 'isbn')}`}
                      value={addForm.isbn}
                      onChange={(e) => setAddField('isbn', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.isbn && <div className="invalid-feedback d-block">{addErrors.isbn}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium" htmlFor="add-classification">
                      Classification
                    </label>
                    <input
                      id="add-classification"
                      className={`form-control ${invalid(addErrors, 'classification')}`}
                      value={addForm.classification}
                      onChange={(e) => setAddField('classification', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.classification && (
                      <div className="invalid-feedback d-block">{addErrors.classification}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium" htmlFor="add-category">
                      Category
                    </label>
                    <input
                      id="add-category"
                      className={`form-control ${invalid(addErrors, 'category')}`}
                      value={addForm.category}
                      onChange={(e) => setAddField('category', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.category && (
                      <div className="invalid-feedback d-block">{addErrors.category}</div>
                    )}
                  </div>

                  <div className="col-md-3 col-6">
                    <label className="form-label fw-medium" htmlFor="add-pages">
                      Pages
                    </label>
                    <input
                      id="add-pages"
                      type="number"
                      min={1}
                      step={1}
                      className={`form-control ${invalid(addErrors, 'pageCount')}`}
                      value={addForm.pageCount}
                      onChange={(e) => setAddField('pageCount', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.pageCount && (
                      <div className="invalid-feedback d-block">{addErrors.pageCount}</div>
                    )}
                  </div>

                  <div className="col-md-3 col-6">
                    <label className="form-label fw-medium" htmlFor="add-price">
                      Price
                    </label>
                    <input
                      id="add-price"
                      type="number"
                      min={0.01}
                      step={0.01}
                      className={`form-control ${invalid(addErrors, 'price')}`}
                      value={addForm.price}
                      onChange={(e) => setAddField('price', e.target.value)}
                      disabled={adding}
                    />
                    {addErrors.price && <div className="invalid-feedback d-block">{addErrors.price}</div>}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-4 pt-3 border-top">
                  <button type="submit" className="btn btn-primary px-4" disabled={adding}>
                    {adding ? 'Saving…' : 'Add book'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={adding}
                    onClick={() => {
                      setAddForm(emptyForm)
                      setAddErrors({})
                      setAddSubmitError(null)
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="card border-0 shadow">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h2 className="h5 mb-0 fw-semibold">Edit selected book</h2>
            </div>
            <div className="card-body p-4">
              {!editingBook && (
                <p className="text-muted mb-0">
                  Select a book from the table and click <span className="fw-semibold">Edit</span>.
                </p>
              )}

              {editingBook && (
                <>
                  <p className="small text-muted mb-3">
                    Editing: <span className="fw-semibold text-body">{editingBook.title}</span>
                  </p>

                  {editSubmitError && (
                    <div className="alert alert-danger" role="alert">
                      {editSubmitError}
                    </div>
                  )}

                  <form onSubmit={onSaveEdit} noValidate>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-medium" htmlFor="edit-title">
                          Title
                        </label>
                        <input
                          id="edit-title"
                          className={`form-control ${invalid(editErrors, 'title')}`}
                          value={editForm.title}
                          onChange={(e) => setEditField('title', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.title && (
                          <div className="invalid-feedback d-block">{editErrors.title}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium" htmlFor="edit-author">
                          Author
                        </label>
                        <input
                          id="edit-author"
                          className={`form-control ${invalid(editErrors, 'author')}`}
                          value={editForm.author}
                          onChange={(e) => setEditField('author', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.author && (
                          <div className="invalid-feedback d-block">{editErrors.author}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium" htmlFor="edit-publisher">
                          Publisher
                        </label>
                        <input
                          id="edit-publisher"
                          className={`form-control ${invalid(editErrors, 'publisher')}`}
                          value={editForm.publisher}
                          onChange={(e) => setEditField('publisher', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.publisher && (
                          <div className="invalid-feedback d-block">{editErrors.publisher}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium" htmlFor="edit-isbn">
                          ISBN
                        </label>
                        <input
                          id="edit-isbn"
                          className={`form-control font-monospace ${invalid(editErrors, 'isbn')}`}
                          value={editForm.isbn}
                          onChange={(e) => setEditField('isbn', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.isbn && (
                          <div className="invalid-feedback d-block">{editErrors.isbn}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium" htmlFor="edit-classification">
                          Classification
                        </label>
                        <input
                          id="edit-classification"
                          className={`form-control ${invalid(editErrors, 'classification')}`}
                          value={editForm.classification}
                          onChange={(e) => setEditField('classification', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.classification && (
                          <div className="invalid-feedback d-block">{editErrors.classification}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium" htmlFor="edit-category">
                          Category
                        </label>
                        <input
                          id="edit-category"
                          className={`form-control ${invalid(editErrors, 'category')}`}
                          value={editForm.category}
                          onChange={(e) => setEditField('category', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.category && (
                          <div className="invalid-feedback d-block">{editErrors.category}</div>
                        )}
                      </div>

                      <div className="col-md-3 col-6">
                        <label className="form-label fw-medium" htmlFor="edit-pages">
                          Pages
                        </label>
                        <input
                          id="edit-pages"
                          type="number"
                          min={1}
                          step={1}
                          className={`form-control ${invalid(editErrors, 'pageCount')}`}
                          value={editForm.pageCount}
                          onChange={(e) => setEditField('pageCount', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.pageCount && (
                          <div className="invalid-feedback d-block">{editErrors.pageCount}</div>
                        )}
                      </div>

                      <div className="col-md-3 col-6">
                        <label className="form-label fw-medium" htmlFor="edit-price">
                          Price
                        </label>
                        <input
                          id="edit-price"
                          type="number"
                          min={0.01}
                          step={0.01}
                          className={`form-control ${invalid(editErrors, 'price')}`}
                          value={editForm.price}
                          onChange={(e) => setEditField('price', e.target.value)}
                          disabled={savingEdit}
                        />
                        {editErrors.price && (
                          <div className="invalid-feedback d-block">{editErrors.price}</div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-4 pt-3 border-top">
                      <button type="submit" className="btn btn-primary px-4" disabled={savingEdit}>
                        {savingEdit ? 'Saving…' : 'Save changes'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={savingEdit}
                        onClick={() => void cancelEdit()}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

