/* Context + hook + types are co-located; Fast Refresh allows only components in default setup. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

const STORAGE_CART = 'booksmith_cart'

export type CartLine = {
  bookId: number
  title: string
  price: number
  quantity: number
}

type CartState = {
  lines: CartLine[]
}

const emptyState: CartState = { lines: [] }

function parseCart(raw: string | null): CartState {
  if (!raw) return emptyState
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return emptyState
    const lines = (parsed as { lines?: unknown }).lines
    if (!Array.isArray(lines)) return emptyState
    const out: CartLine[] = []
    for (const row of lines) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const bookId = Number(r.bookId)
      const title = typeof r.title === 'string' ? r.title : ''
      const price = Number(r.price)
      const quantity = Math.floor(Number(r.quantity))
      if (!Number.isFinite(bookId) || bookId < 1) continue
      if (!Number.isFinite(price) || price < 0) continue
      if (!Number.isFinite(quantity) || quantity < 1) continue
      out.push({ bookId, title, price, quantity })
    }
    return { lines: out }
  } catch {
    return emptyState
  }
}

function readCartFromStorage(): CartState {
  if (typeof sessionStorage === 'undefined') return emptyState
  return parseCart(sessionStorage.getItem(STORAGE_CART))
}

function writeCartToStorage(state: CartState) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_CART, JSON.stringify(state))
}

let cartListeners: Array<() => void> = []
let cartCache: CartState = readCartFromStorage()

function emitCart() {
  cartListeners.forEach((l) => l())
}

function subscribeCart(cb: () => void) {
  cartListeners = [...cartListeners, cb]
  return () => {
    cartListeners = cartListeners.filter((x) => x !== cb)
  }
}

function getCartSnapshot(): CartState {
  return cartCache
}

function setCartState(updater: (prev: CartState) => CartState) {
  cartCache = updater(cartCache)
  writeCartToStorage(cartCache)
  emitCart()
}

type BookLike = {
  bookId: number
  title: string
  price: number
}

type CartContextValue = {
  lines: CartLine[]
  totalQuantity: number
  orderTotal: number
  lineSubtotal: (line: CartLine) => number
  addItem: (book: BookLike, quantity?: number) => void
  setQuantity: (bookId: number, quantity: number) => void
  removeLine: (bookId: number) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartSnapshot)

  const addItem = useCallback((book: BookLike, quantity = 1) => {
    const q = Math.max(1, Math.floor(quantity))
    setCartState((prev) => {
      const idx = prev.lines.findIndex((l) => l.bookId === book.bookId)
      if (idx === -1) {
        return {
          lines: [
            ...prev.lines,
            { bookId: book.bookId, title: book.title, price: book.price, quantity: q },
          ],
        }
      }
      const next = [...prev.lines]
      const line = next[idx]!
      next[idx] = { ...line, quantity: line.quantity + q }
      return { lines: next }
    })
  }, [])

  const setQuantity = useCallback((bookId: number, quantity: number) => {
    const q = Math.floor(quantity)
    if (q < 1) {
      setCartState((prev) => ({
        lines: prev.lines.filter((l) => l.bookId !== bookId),
      }))
      return
    }
    setCartState((prev) => ({
      lines: prev.lines.map((l) =>
        l.bookId === bookId ? { ...l, quantity: q } : l,
      ),
    }))
  }, [])

  const removeLine = useCallback((bookId: number) => {
    setCartState((prev) => ({
      lines: prev.lines.filter((l) => l.bookId !== bookId),
    }))
  }, [])

  const lineSubtotal = useCallback((line: CartLine) => line.quantity * line.price, [])

  const totalQuantity = useMemo(
    () => state.lines.reduce((s, l) => s + l.quantity, 0),
    [state.lines],
  )

  const orderTotal = useMemo(
    () => state.lines.reduce((s, l) => s + lineSubtotal(l), 0),
    [state.lines, lineSubtotal],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      totalQuantity,
      orderTotal,
      lineSubtotal,
      addItem,
      setQuantity,
      removeLine,
    }),
    [
      state.lines,
      totalQuantity,
      orderTotal,
      lineSubtotal,
      addItem,
      setQuantity,
      removeLine,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
