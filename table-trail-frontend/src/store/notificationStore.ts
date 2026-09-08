import { create } from 'zustand'

export type NotificationVariant = 'error' | 'success' | 'info'

export interface AppNotification {
  id: string
  variant: NotificationVariant
  message: string
}

const AUTO_DISMISS_MS = 6000

interface NotificationState {
  notifications: AppNotification[]
  notify: (variant: NotificationVariant, message: string) => void
  dismiss: (id: string) => void
}

/**
 * Unified, app-wide notification/toast state — rendered top-right by
 * `NotificationViewport` (mounted once in `AppShell`). Deliberately a
 * plain Zustand store rather than React context: `notify()` needs to be
 * callable from outside components too (e.g. a mutation's `onError` in
 * `GraphCanvas`), which `useNotificationStore.getState().notify(...)`
 * supports directly, no hook required.
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  notify: (variant, message) => {
    const id = crypto.randomUUID()
    set((state) => ({ notifications: [...state.notifications, { id, variant, message }] }))
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS)
  },

  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}))

/** Convenience shorthand for the common case — an error surfaced from a failed request. */
export function notifyError(message: string) {
  useNotificationStore.getState().notify('error', message)
}
