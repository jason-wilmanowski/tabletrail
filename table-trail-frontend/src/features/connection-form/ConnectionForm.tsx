import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScan } from '../../hooks/useScan'
import type { DBType, ConnectionFields } from '../../types/common'

interface FormValues {
  name: string
  db_type: DBType | ''
  host: string
  port: string
  db_name: string
  username: string
  password: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const DB_TYPE_OPTIONS: { value: DBType; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
]

const INITIAL_VALUES: FormValues = {
  name: '',
  db_type: '',
  host: '',
  port: '',
  db_name: '',
  username: '',
  password: '',
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!values.db_type) {
    errors.db_type = 'Database type is required'
  }

  if (!values.host.trim()) {
    errors.host = 'Host is required'
  }

  if (!values.port.trim()) {
    errors.port = 'Port is required'
  } else {
    const portNumber = Number(values.port)
    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      errors.port = 'Port must be a number between 1 and 65535'
    }
  }

  if (!values.db_name.trim()) {
    errors.db_name = 'Database name is required'
  }

  if (!values.username.trim()) {
    errors.username = 'Username is required'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  }

  return errors
}

const FIELD_CLASSES =
  'w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const LABEL_CLASSES = 'mb-1 block text-xs font-medium text-muted-foreground'

/**
 * Connection form UI. Owns local field state and client-side validation,
 * and — as of Step 9 — triggers the actual scan request via `useScan()`
 * (Step 3's `scanDatabase` API function under the hood) and navigates to
 * the resulting database's detail page on success.
 *
 * As of Step 29, all fields use the design tokens from Step 28
 * (`surface`/`border`/`foreground`/`ring`) instead of unstyled native
 * browser controls — this form was left visually bare since Step 8, which
 * clashed against the now dark-themed body.
 */
export function ConnectionForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})
  const navigate = useNavigate()
  const scanMutation = useScan()

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validate(values)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // Validation above guarantees db_type is set, safe to narrow from '' here.
    const payload: ConnectionFields = {
      ...values,
      db_type: values.db_type as DBType,
    }

    scanMutation.mutate(payload, {
      onSuccess: (database) => {
        navigate(`/database/${database.id}`)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-sm space-y-4">
      <div>
        <label htmlFor="name" className={LABEL_CLASSES}>
          Name
        </label>
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={FIELD_CLASSES}
        />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="db_type" className={LABEL_CLASSES}>
          Database Type
        </label>
        <select
          id="db_type"
          value={values.db_type}
          onChange={(e) => updateField('db_type', e.target.value as DBType)}
          className={FIELD_CLASSES}
        >
          <option value="">Select a database type</option>
          {DB_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.db_type && <p className="mt-1 text-xs text-danger">{errors.db_type}</p>}
      </div>

      <div>
        <label htmlFor="host" className={LABEL_CLASSES}>
          Host
        </label>
        <input
          id="host"
          type="text"
          placeholder="localhost"
          value={values.host}
          onChange={(e) => updateField('host', e.target.value)}
          className={FIELD_CLASSES}
        />
        {errors.host && <p className="mt-1 text-xs text-danger">{errors.host}</p>}
      </div>

      <div>
        <label htmlFor="port" className={LABEL_CLASSES}>
          Port
        </label>
        <input
          id="port"
          type="number"
          min={1}
          max={65535}
          value={values.port}
          onChange={(e) => updateField('port', e.target.value)}
          className={FIELD_CLASSES}
        />
        {errors.port && <p className="mt-1 text-xs text-danger">{errors.port}</p>}
      </div>

      <div>
        <label htmlFor="db_name" className={LABEL_CLASSES}>
          Database Name
        </label>
        <input
          id="db_name"
          type="text"
          value={values.db_name}
          onChange={(e) => updateField('db_name', e.target.value)}
          className={FIELD_CLASSES}
        />
        {errors.db_name && <p className="mt-1 text-xs text-danger">{errors.db_name}</p>}
      </div>

      <div>
        <label htmlFor="username" className={LABEL_CLASSES}>
          Username
        </label>
        <input
          id="username"
          type="text"
          value={values.username}
          onChange={(e) => updateField('username', e.target.value)}
          className={FIELD_CLASSES}
        />
        {errors.username && <p className="mt-1 text-xs text-danger">{errors.username}</p>}
      </div>

      <div>
        <label htmlFor="password" className={LABEL_CLASSES}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => updateField('password', e.target.value)}
          className={FIELD_CLASSES}
        />
        {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
      </div>

      {scanMutation.isError && (
        <p className="text-sm text-danger">{scanMutation.error.message}</p>
      )}

      <button
        type="submit"
        disabled={scanMutation.isPending}
        className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      >
        {scanMutation.isPending ? 'Connecting...' : 'Connect'}
      </button>
    </form>
  )
}
