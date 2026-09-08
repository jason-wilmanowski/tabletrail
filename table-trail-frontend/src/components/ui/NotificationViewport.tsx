import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import type { NotificationVariant } from '../../store/notificationStore'

const VARIANT_STYLES: Record<NotificationVariant, { icon: typeof AlertCircle; border: string; iconColor: string }> = {
  error: { icon: AlertCircle, border: 'border-danger/40', iconColor: 'text-danger' },
  success: { icon: CheckCircle2, border: 'border-success/40', iconColor: 'text-success' },
  info: { icon: Info, border: 'border-border', iconColor: 'text-muted-foreground' },
}

/**
 * App-wide toast stack, fixed top-right regardless of route — mounted
 * once in `AppShell` so any part of the app (a failed mutation deep in
 * `GraphCanvas`, a future feature elsewhere) can surface an error via
 * `notifyError()`/`useNotificationStore` without rendering its own UI
 * for it.
 *
 * `pointer-events-none` on the wrapper (re-enabled per-toast) keeps the
 * empty space around toasts from blocking clicks on whatever's
 * underneath, same reasoning as React Flow's own overlay panels.
 */
export function NotificationViewport() {
  const notifications = useNotificationStore((state) => state.notifications)
  const dismiss = useNotificationStore((state) => state.dismiss)

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {notifications.map((notification) => {
        const { icon: Icon, border, iconColor } = VARIANT_STYLES[notification.variant]

        return (
          <div
            key={notification.id}
            role="alert"
            className={`animate-toast-in pointer-events-auto flex items-start gap-2 rounded-md border ${border} bg-panel p-3 shadow-lg`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
            <p className="text-body flex-1">{notification.message}</p>
            <button
              type="button"
              onClick={() => dismiss(notification.id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Schließen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
