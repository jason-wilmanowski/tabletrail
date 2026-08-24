import { siMarkdown } from 'simple-icons'
import { FileJson, FileText } from 'lucide-react'
import type { ExportFormat } from '../../types/common'

const COLORS: Record<ExportFormat, string> = {
  pdf: '#DC2626',
  json: '#D97706',
  markdown: '#059669',
}

interface ExportTypeIconProps {
  type: ExportFormat
  className?: string
}

/**
 * PDF and JSON both use Lucide's own file glyphs (no genuine "PDF" brand
 * mark exists — PDF is a format, not a company — and simple-icons' actual
 * JSON logo is an abstract circular badge that reads as an unlabeled dot
 * at sidebar icon size, worse than a literal "file with braces" glyph).
 * Markdown keeps its real simple-icons brand mark since that one *is*
 * legible small — a distinct "M↓" shape, not an abstract badge.
 */
export function ExportTypeIcon({ type, className }: ExportTypeIconProps) {
  if (type === 'pdf') {
    return <FileText className={className} style={{ color: COLORS.pdf }} aria-hidden="true" />
  }

  if (type === 'json') {
    return <FileJson className={className} style={{ color: COLORS.json }} aria-hidden="true" />
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill={COLORS.markdown} aria-hidden="true">
      <path d={siMarkdown.path} />
    </svg>
  )
}
