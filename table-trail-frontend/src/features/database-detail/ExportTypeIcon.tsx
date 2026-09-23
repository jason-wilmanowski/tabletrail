import { siMarkdown } from 'simple-icons'
import { FileJson, FileText } from 'lucide-react'
import type { ComponentType } from 'react'
import type { ExportFormat } from '../../types/common'

const COLORS: Record<ExportFormat, string> = {
  pdf: '#DC2626',
  json: '#D97706',
  markdown: '#059669',
}

interface IconProps {
  className?: string
}

interface ExportTypeIconProps extends IconProps {
  type: ExportFormat
}

/*
 * PDF and JSON both use Lucide's own file glyphs (no genuine "PDF" brand
 * mark exists — PDF is a format, not a company — and simple-icons' actual
 * JSON logo is an abstract circular badge that reads as an unlabeled dot
 * at sidebar icon size, worse than a literal "file with braces" glyph).
 * Markdown keeps its real simple-icons brand mark since that one *is*
 * legible small — a distinct "M↓" shape, not an abstract badge.
 *
 * Exported one per format too, for places that take an icon component
 * rather than a format (e.g. select options in `settingsRegistry`).
 */
export function PdfExportIcon({ className }: IconProps) {
  return <FileText className={className} style={{ color: COLORS.pdf }} aria-hidden="true" />
}

export function JsonExportIcon({ className }: IconProps) {
  return <FileJson className={className} style={{ color: COLORS.json }} aria-hidden="true" />
}

export function MarkdownExportIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={COLORS.markdown} aria-hidden="true">
      <path d={siMarkdown.path} />
    </svg>
  )
}

const ICONS: Record<ExportFormat, ComponentType<IconProps>> = {
  pdf: PdfExportIcon,
  json: JsonExportIcon,
  markdown: MarkdownExportIcon,
}

export function ExportTypeIcon({ type, className }: ExportTypeIconProps) {
  const Icon = ICONS[type]
  return <Icon className={className} />
}
