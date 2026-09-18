import { Loader2 } from 'lucide-react'

/**
 * Centered loading placeholder for wherever `GraphCanvas` would normally
 * sit — same layout/sizing as `DatabaseEmptyState` (icon + heading +
 * subtext, `h-8 w-8` icon) so it reads as the same family of "main window"
 * template, just with a spinning icon instead of a static one. Large
 * databases (e.g. Odoo-scale schemas) can take a few seconds to fetch, and
 * a bare "Loading database..." text with no animation reads as the page
 * being stuck rather than working.
 */
export function DatabaseLoadingState() {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <h1 className="text-display mt-3">Loading database</h1>
        <p className="text-body mt-2">This can take a few seconds for large databases.</p>
      </div>
    </div>
  )
}
