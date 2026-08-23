import { AlertCircle, Database, Layers, RefreshCw, Trash2 } from 'lucide-react'

const NEXT_STEPS = [
  { icon: Layers, text: 'Add tables and columns to the database' },
  { icon: AlertCircle, text: 'Check the error messages from the last scan' },
  { icon: RefreshCw, text: 'Update the database details and rescan' },
  { icon: Trash2, text: 'Delete the database and reconnect it' },
]

export function DatabaseEmptyState() {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <Database className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-display mt-3">Database is empty</h1>
        <p className="text-body mt-2">
          No tables were found for this database. Here&apos;s what you can try next:
        </p>

        <ul className="mt-8 w-full space-y-3 border-t border-border pt-6">
          {NEXT_STEPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center justify-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-body">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
