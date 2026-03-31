import { X, RotateCcw } from 'lucide-react'
import useChatStore from '../store/chatStore'

const DEFAULTS = { temperature: 0.7, top_p: 0.9, max_tokens: null, system_prompt: '' }

function Slider({ label, value, min, max, step, onChange, description }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-[#ccc]">{label}</label>
        <span className="text-sm text-[#2affd4] font-mono tabular-nums">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#2affd4] cursor-pointer"
      />
      {description && <p className="text-xs text-[#888] mt-1.5">{description}</p>}
    </div>
  )
}

export default function ModelSettings({ onClose }) {
  const { settings, updateSettings } = useChatStore()

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 h-full bg-[#111] border-l border-[#1e1e1e] p-6 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1e1e1e] rounded-lg transition-colors text-[#888] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <Slider
          label="Temperature"
          value={settings.temperature}
          min={0} max={2} step={0.05}
          onChange={(v) => updateSettings({ temperature: v })}
          description="Higher = more creative · Lower = more focused"
        />

        <Slider
          label="Top-P"
          value={settings.top_p}
          min={0} max={1} step={0.05}
          onChange={(v) => updateSettings({ top_p: v })}
          description="Nucleus sampling threshold"
        />

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#ccc] mb-2">Max Tokens</label>
          <input
            type="number"
            placeholder="Unlimited"
            value={settings.max_tokens ?? ''}
            onChange={(e) => updateSettings({ max_tokens: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-[#1a1a1a] text-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm border border-[#2a2a2a] focus:outline-none focus:border-[#2affd4]/30 placeholder-[#444]"
          />
          <p className="text-xs text-[#888] mt-1.5">Leave empty for no limit</p>
        </div>

        <div className="mb-6 flex-1">
          <label className="block text-sm font-medium text-[#ccc] mb-2">System Prompt</label>
          <textarea
            value={settings.system_prompt}
            onChange={(e) => updateSettings({ system_prompt: e.target.value })}
            placeholder="You are a helpful assistant…"
            rows={6}
            className="w-full bg-[#1a1a1a] text-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm border border-[#2a2a2a] focus:outline-none focus:border-[#2affd4]/30 resize-none placeholder-[#444]"
          />
        </div>

        <button
          onClick={() => updateSettings(DEFAULTS)}
          className="flex items-center gap-2 text-xs text-[#888] hover:text-white transition-colors mt-auto"
        >
          <RotateCcw size={13} />
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
