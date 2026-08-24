import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { ExportTypeIcon } from './ExportTypeIcon'
import { useExportDatabase } from '../../hooks/useExport'
import type { ExportFormat } from '../../types/common'

const EXPORT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
]

interface ExportButtonProps {
  databaseId: number
}

export function ExportButton({ databaseId }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFormatOpen, setIsFormatOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const containerRef = useRef<HTMLDivElement>(null)

  const exportMutation = useExportDatabase(databaseId)
  const selected = EXPORT_OPTIONS.find((option) => option.value === selectedFormat) ?? EXPORT_OPTIONS[0]

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFormatOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setIsFormatOpen(false)
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
    <div ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-all duration-200 hover:bg-accent/90 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          isOpen ? '-translate-y-0.5' : 'translate-y-0'
        }`}
      >
        <Download className="h-3.5 w-3.5" />
        Export Database
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? 'mt-2 grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        {/* overflow stays hidden only while collapsed/animating — once fully
            open it must not clip the format dropdown's popover list, which
            opens upward (bottom-full) past this wrapper's own box */}
        <div className={isOpen ? 'overflow-visible' : 'overflow-hidden'}>
          <div className="flex items-stretch gap-1.5">
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsFormatOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-1.5">
                  <ExportTypeIcon type={selected.value} className="h-3.5 w-3.5 shrink-0" />
                  {selected.label}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>

              {isFormatOpen && (
                <ul className="absolute bottom-full z-10 mb-1 w-full rounded-md border border-border bg-surface py-1 shadow-none">
                  {EXPORT_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFormat(option.value)
                          setIsFormatOpen(false)
                        }}
                        className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-hover ${
                          option.value === selectedFormat ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        <ExportTypeIcon type={option.value} className="h-3.5 w-3.5 shrink-0" />
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => exportMutation.mutate(selectedFormat)}
              disabled={exportMutation.isPending}
              title={`Download as ${selected.label}`}
              className="flex shrink-0 items-center justify-center rounded-md bg-accent px-2.5 text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {exportMutation.isError && (
            <p className="mt-1.5 text-xs text-danger">{exportMutation.error.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
