import { useState } from 'react'
import { Sparkles, Palette, SlidersHorizontal, Network } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SettingsTab {
  id: string
  label: string
  icon: LucideIcon
  description: string
}

const TABS: SettingsTab[] = [
  {
    id: 'ai-models',
    label: 'AI Models',
    icon: Sparkles,
    description: 'Configure AI-powered explanations and database insights. Coming soon.',
  },
  {
    id: 'design',
    label: 'Design',
    icon: Palette,
    description: 'Customize theme and appearance preferences. Coming soon.',
  },
  {
    id: 'general',
    label: 'General',
    icon: SlidersHorizontal,
    description: 'General application preferences. Coming soon.',
  },
  {
    id: 'graph',
    label: 'Graph',
    icon: Network,
    description: 'Configure default graph layout and visualization behavior. Coming soon.',
  },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

  return (
    <div className="flex h-full">
      <nav className="w-56 shrink-0 border-r border-border bg-panel p-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2 rounded-md border-l-2 px-2 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                isActive
                  ? 'border-l-accent bg-surface-hover text-foreground'
                  : 'border-l-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-section">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-display">{active.label}</h1>
        <p className="text-body mt-2">{active.description}</p>
      </div>
    </div>
  )
}
