import { siPostgresql, siMysql, siMariadb } from 'simple-icons'
import type { DBType } from '../../types/common'

const ICONS: Record<DBType, { path: string; hex: string }> = {
  postgresql: siPostgresql,
  mysql: siMysql,
  mariadb: siMariadb,
}

interface DatabaseTypeIconProps {
  type: DBType
  className?: string
}

export function DatabaseTypeIcon({ type, className }: DatabaseTypeIconProps) {
  const icon = ICONS[type]

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={`#${icon.hex}`}
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  )
}
