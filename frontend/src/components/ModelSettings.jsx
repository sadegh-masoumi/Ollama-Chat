import { X, RotateCcw } from 'lucide-react'
import useChatStore from '../store/chatStore'

const DEFAULTS = { temperature: 0.7, top_p: 0.9, max_tokens: null, system_prompt: '' }

function Slider({ label, value, min, max, step, onChange, description }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        <span className="text-sm text-amber-400 font-mono">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500"
      />
      {description && <p className="text-xs text-zinc-600 mt-1">{description}</p>}
    </div>
  )
}

export default function ModelSettings({ onClose }) {
  const { settings, updateSettings } = useChatStore()

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-80 h-full bg-zinc-950 border-l border-zinc-800 p-5 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Model Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        <Slider
          label="Temperature"
          value={settings.temperature}
          min={0} max={2} step={0.05}
          onChange={(v) => updateSettings({ temperature: v })}
          description="Higher = more creative, lower = more focused"
        />

        <Slider
          label="Top-P"
          value={settings.top_p}
          min={0} max={1} step={0.05}
          onChange={(v) => updateSettings({ top_p: v })}
          description="Nucleus sampling threshold"
        />

        <div className="mb-5">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Max Tokens</label>
          <input
            type="number"
            placeholder="Unlimited"
            value={settings.max_tokens ?? ''}
            onChange={(e) => updateSettings({ max_tokens: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-zinc-900 text-zinc-100 rounded-lg px-3 py-2 text-sm border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <p className="text-xs text-zinc-600 mt-1">Leave empty for no limit</p>
        </div>

        <div className="mb-5 flex-1">
          <label className="block text-sm font-medium text-zinc-300 mb-1">System Prompt</label>
          <textarea
            value={settings.system_prompt}
            onChange={(e) => updateSettings({ system_prompt: e.target.value })}
            placeholder="You are a helpful assistant…"
            rows={6}
            className="w-full bg-zinc-900 text-zinc-100 rounded-lg px-3 py-2 text-sm border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none placeholder-zinc-600"
          />
        </div>

        <button
          onClick={() => updateSettings(DEFAULTS)}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors mt-auto"
        >
          <RotateCcw size={14} />
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
