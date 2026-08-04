import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { DatabaseTypeSelect } from '../connection-form/DatabaseTypeSelect'
import type { DatabaseStructureResponse } from '../../types/database'
import type { DBType } from '../../types/common'

const FIELD_CLASSES =
  'w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const LABEL_CLASSES = 'mb-1 block text-xs font-medium text-muted-foreground'

interface EditDatabaseModalProps {
  database: DatabaseStructureResponse
  onClose: () => void
}

export function EditDatabaseModal({ database, onClose }: EditDatabaseModalProps) {
  const [name, setName] = useState(database.name)
  const [dbType, setDbType] = useState<DBType>(database.db_type)
  const [host, setHost] = useState(database.host)
  const [port, setPort] = useState(database.port)
  const [dbName, setDbName] = useState(database.db_name)
  const [username, setUsername] = useState(database.username)
  const [password, setPassword] = useState(database.password)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Modal onClose={onClose}>
      <h2 className="text-section">Edit Details</h2>

      <div className="mt-4 space-y-3">
        <div>
          <label className={LABEL_CLASSES}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className={LABEL_CLASSES}>Database Type</label>
          <DatabaseTypeSelect value={dbType} onChange={setDbType} fieldClassName={FIELD_CLASSES} />
        </div>

        <div>
          <label className={LABEL_CLASSES}>Host</label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className={LABEL_CLASSES}>Port</label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className={LABEL_CLASSES}>Database Name</label>
          <input
            type="text"
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className={LABEL_CLASSES}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={FIELD_CLASSES}
          />
        </div>

        <div>
          <label className={LABEL_CLASSES}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${FIELD_CLASSES} pr-9`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Save Changes
      </button>
    </Modal>
  )
}
