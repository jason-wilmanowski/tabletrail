import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  confirmLabel: string
  pendingLabel: string
  isPending: boolean
  errorMessage?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

const CONFIRM_CLASSES_DEFAULT =
  'flex-1 rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60'

const CONFIRM_CLASSES_DANGER =
  'flex-1 rounded-md border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60'

const CANCEL_CLASSES =
  'flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function ConfirmDialog({
  title,
  confirmLabel,
  pendingLabel,
  isPending,
  errorMessage,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel}>
      <h2 className="text-section">{title}</h2>

      {errorMessage && <p className="mt-3 text-sm text-danger">{errorMessage}</p>}

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onCancel} disabled={isPending} className={CANCEL_CLASSES}>
          No
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className={variant === 'danger' ? CONFIRM_CLASSES_DANGER : CONFIRM_CLASSES_DEFAULT}
        >
          {isPending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
