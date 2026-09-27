import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useSettingsStore, useSettingValue } from '../../store/settingsStore'
import { findSettingDefinition } from './settingsRegistry'
import type {
  PaletteOption,
  PaletteSetting,
  SelectOption,
  SelectSetting,
  SettingDefinition,
  SettingsCategoryDef,
  SettingsSectionDef,
  ToggleSetting,
} from './settingsRegistry'

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
  const isDisabled = useSettingsStore((state) => {
    if (!setting.enabledBy) {
      return false
    }
    const parentValue = state.values[setting.enabledBy] ?? findSettingDefinition(setting.enabledBy)?.defaultValue
    return parentValue !== true
  })

  return (
    <div
      className={`flex items-center justify-between gap-6 px-4 py-3 transition-opacity duration-200 ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-foreground">
          {setting.label}
        </p>
        {setting.description && <p className="text-body mt-0.5">{setting.description}</p>}
      </div>
      <div className="shrink-0">
        <SettingControl setting={setting} labelId={labelId} disabled={isDisabled} />
      </div>
    </div>
  )
}

interface SettingControlProps<T extends SettingDefinition> {
  setting: T
  labelId: string
  disabled: boolean
}

function SettingControl({ setting, labelId, disabled }: SettingControlProps<SettingDefinition>) {
  switch (setting.type) {
    case 'toggle':
      return <ToggleSettingControl setting={setting} labelId={labelId} disabled={disabled} />
    case 'select':
      return <SelectSettingControl setting={setting} labelId={labelId} disabled={disabled} />
    case 'palette':
      return <PaletteSettingControl setting={setting} labelId={labelId} disabled={disabled} />
  }
}

function ToggleSettingControl({ setting, labelId, disabled }: SettingControlProps<ToggleSetting>) {
  const setValue = useSettingsStore((state) => state.setValue)
  const value = useSettingValue(setting.key, setting.defaultValue)

  return (
    <Switch
      checked={value}
      onChange={(next) => setValue(setting.key, next)}
      labelledBy={labelId}
      disabled={disabled}
    />
  )
}

function SelectSettingControl({ setting, labelId, disabled }: SettingControlProps<SelectSetting>) {
  const setValue = useSettingsStore((state) => state.setValue)
  const value = useSettingValue(setting.key, setting.defaultValue)

  return (
    <Select
      disabled={disabled}
      options={setting.options}
      // A stored value whose option was since removed falls back to the default.
      value={setting.options.some((option) => option.value === value) ? value : setting.defaultValue}
      onChange={(next) => setValue(setting.key, next)}
      labelledBy={labelId}
    />
  )
}

function PaletteSettingControl({ setting, labelId, disabled }: SettingControlProps<PaletteSetting>) {
  const setValue = useSettingsStore((state) => state.setValue)
  const value = useSettingValue(setting.key, setting.defaultValue)

  return (
    <Palette
      disabled={disabled}
      options={setting.options}
      columns={setting.columns}
      // A stored value whose option was since removed falls back to the default.
      value={setting.options.some((option) => option.value === value) ? value : setting.defaultValue}
      onChange={(next) => setValue(setting.key, next)}
      labelledBy={labelId}
    />
  )
}

/**
 * Same trigger/list styling as the app's other dropdowns (`DatabaseTypeSelect`,
 * `ExportButton`); the list is right-aligned since it always sits at a row's
 * right edge, and the active option carries a check mark.
 */
function Select({
  options,
  value,
  onChange,
  labelledBy,
  disabled = false,
}: {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  labelledBy: string
  disabled?: boolean
}): ReactNode {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((option) => option.value === value)

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
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={labelledBy}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-40 items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1 text-left text-sm text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:hover:bg-surface ${
          isOpen ? 'bg-surface-hover' : 'bg-surface'
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected?.icon && <selected.icon className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{selected?.label}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby={labelledBy}
          className="absolute right-0 z-10 mt-1 min-w-full rounded-md border border-border bg-surface py-1 shadow-none"
        >
          {options.map((option) => {
            const isActive = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {option.icon && <option.icon className="h-3.5 w-3.5 shrink-0" />}
                    {option.label}
                  </span>
                  <Check className={`h-3.5 w-3.5 shrink-0 text-accent ${isActive ? '' : 'invisible'}`} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * Swatch grid with `columns` swatches per row. Behaves like a radio group:
 * only the selected swatch is in the tab order, arrow keys move the
 * selection (left/right by one, up/down by a row). The selected swatch is
 * ringed and its label is shown below the grid, so the current choice is
 * readable without hovering.
 */
function Palette({
  options,
  columns,
  value,
  onChange,
  labelledBy,
  disabled = false,
}: {
  options: PaletteOption[]
  columns: number
  value: string
  onChange: (value: string) => void
  labelledBy: string
  disabled?: boolean
}): ReactNode {
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = options.findIndex((option) => option.value === value)

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }
    const step = steps[event.key]
    if (step === undefined) {
      return
    }
    event.preventDefault()
    const nextIndex = Math.min(Math.max(selectedIndex + step, 0), options.length - 1)
    onChange(options[nextIndex].value)
    swatchRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        onKeyDown={disabled ? undefined : handleKeyDown}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, 1.25rem)` }}
      >
        {options.map((option, index) => {
          const isActive = index === selectedIndex
          return (
            <button
              key={option.value}
              ref={(element) => {
                swatchRefs.current[index] = element
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={option.label}
              title={option.label}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              style={{ backgroundColor: option.color }}
              className={`h-5 w-5 rounded-full border border-foreground/15 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed ${
                isActive ? 'ring-2 ring-foreground ring-offset-2 ring-offset-panel' : 'enabled:hover:scale-110'
              }`}
            />
          )
        })}
      </div>
      <span className="text-technical-muted">{options[selectedIndex]?.label}</span>
    </div>
  )
}

/**
 * Knob is anchored at `left-[2px]` and only moves via `translate-x`. Off:
 * unfilled track, `muted-foreground` knob. On: `accent` track, white knob.
 */
function Switch({
  checked,
  onChange,
  labelledBy,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  labelledBy: string
  disabled?: boolean
}): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-4 w-7 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed ${
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
