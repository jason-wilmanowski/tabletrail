import type { ReactNode } from 'react'
import { useSettingsStore, useSettingValue } from '../../store/settingsStore'
import type { SettingDefinition, SettingsCategoryDef, SettingsSectionDef } from './settingsRegistry'

/**
 * Detail page shared by every settings category: header, then its sections
 * as bordered cards (or a coming-soon note when a category has none).
 */
export function SettingsView({ category }: { category: SettingsCategoryDef }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-8">
      <header className="mb-8">
        <h1 className="text-display">{category.label}</h1>
        <p className="text-body mt-1.5">{category.description}</p>
      </header>

      {category.sections.length > 0 ? (
        <div className="flex flex-col gap-8">
          {category.sections.map((section) => (
            <SettingsSection key={section.id} section={section} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-4 py-10 text-center">
          <p className="text-body">No settings here yet — coming soon.</p>
        </div>
      )}
    </div>
  )
}

function SettingsSection({ section }: { section: SettingsSectionDef }) {
  return (
    <section>
      <h2 className="text-label mb-2">{section.title}</h2>
      <div className="divide-y divide-border rounded-md border border-border bg-panel">
        {section.settings.map((setting) => (
          <SettingRow key={setting.key} setting={setting} />
        ))}
      </div>
    </section>
  )
}

/** Label + description on the left, the control for the setting's type on the right. */
function SettingRow({ setting }: { setting: SettingDefinition }) {
  const labelId = `setting-${setting.key}`

  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-foreground">
          {setting.label}
        </p>
        {setting.description && <p className="text-body mt-0.5">{setting.description}</p>}
      </div>
      <div className="shrink-0">
        <SettingControl setting={setting} labelId={labelId} />
      </div>
    </div>
  )
}

function SettingControl({ setting, labelId }: { setting: SettingDefinition; labelId: string }) {
  const setValue = useSettingsStore((state) => state.setValue)
  const value = useSettingValue(setting.key, setting.defaultValue)

  switch (setting.type) {
    case 'toggle':
      return <Switch checked={value} onChange={(next) => setValue(setting.key, next)} labelledBy={labelId} />
  }
}

/**
 * Knob is anchored at `left-[2px]` and only moves via `translate-x`. Off:
 * unfilled track, `muted-foreground` knob. On: `accent` track, white knob.
 */
function Switch({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  labelledBy: string
}): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={`relative h-4 w-7 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        checked ? 'border-accent bg-accent' : 'border-border bg-surface'
      }`}
    >
      <span
        className={`absolute left-[2px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all duration-200 ease-out ${
          checked ? 'translate-x-[12px] bg-accent-foreground' : 'translate-x-0 bg-muted-foreground'
        }`}
      />
    </button>
  )
}
