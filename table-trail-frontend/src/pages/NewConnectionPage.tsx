import { ConnectionForm } from '../features/connection-form/ConnectionForm'

/**
 * Route `/connect`. Coordinates only — no form logic lives here, that's
 * owned entirely by the `ConnectionForm` feature component.
 */
export function NewConnectionPage() {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-display">New Connection</h1>
        <div className="mt-4">
          <ConnectionForm />
        </div>
      </div>
    </div>
  )
}
