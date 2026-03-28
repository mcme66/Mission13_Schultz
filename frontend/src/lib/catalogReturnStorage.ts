const STORAGE_RETURN = 'booksmith_catalog_return'

export function saveCatalogReturnSearch(search: string) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_RETURN, search)
}

export function getCatalogReturnSearch(): string {
  if (typeof sessionStorage === 'undefined') return ''
  return sessionStorage.getItem(STORAGE_RETURN) ?? ''
}
