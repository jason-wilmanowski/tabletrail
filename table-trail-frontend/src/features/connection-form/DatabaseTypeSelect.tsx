import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DatabaseTypeIcon } from './DatabaseTypeIcon'
import type { DBType } from '../../types/common'

const DB_TYPE_OPTIONS: { value: DBType; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
]

interface DatabaseTypeSelectProps {
  id?: string
  value: DBType | ''
  onChange: (value: DBType) => void
  fieldClassName: string
}

export function DatabaseTypeSelect({
  id,
  value,
  onChange,
  fieldClassName,
}: DatabaseTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = DB_TYPE_OPTIONS.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${fieldClassName} flex items-center justify-between text-left`}
      >
        <span className="flex items-center gap-2">
          {selected && <DatabaseTypeIcon type={selected.value} className="h-4 w-4" />}
          <span className={selected ? '' : 'text-muted-foreground'}>
            {selected ? selected.label : 'Select a database type'}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface py-1 shadow-none">
          {DB_TYPE_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-hover ${
                  option.value === value ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <DatabaseTypeIcon type={option.value} className="h-4 w-4" />
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
