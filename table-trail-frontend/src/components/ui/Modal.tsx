import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  children: ReactNode
}

export function Modal({ onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md border border-border bg-panel p-4 shadow-none"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
