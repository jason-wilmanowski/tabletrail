import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  actionTo: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <h2 className="text-section">{title}</h2>
      <p className="text-body max-w-sm">{description}</p>
      <button
        type="button"
        onClick={() => navigate(actionTo)}
        className="mt-2 rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {actionLabel}
      </button>
    </div>
  )
}
