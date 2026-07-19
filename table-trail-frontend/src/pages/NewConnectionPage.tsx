import { ConnectionForm } from '../features/connection-form/ConnectionForm'

/**
 * Route `/connect`. Coordinates only — no form logic lives here, that's
 * owned entirely by the `ConnectionForm` feature component.
 */
export function NewConnectionPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">New Connection</h1>
      <ConnectionForm />
    </div>
  )
}
