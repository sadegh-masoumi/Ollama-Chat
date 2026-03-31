import { Plus, Trash2, Settings, RefreshCw, MessageSquare } from 'lucide-react'
import clsx from 'clsx'
import useChatStore from '../store/chatStore'
import { useModels } from '../hooks/useModels'
import { deleteConversation, getConversation } from '../api/client'

export default function Sidebar({ open, onNewChat, onOpenSettings }) {
  const {
    conversations, activeConversationId,
    setActiveConversation, removeConversation,
    currentModel, setCurrentModel,
  } = useChatStore()
  const { models, isLoading: modelsLoading, refetch } = useModels()

  const handleSelect = async (id) => {
    try {
      const conv = await getConversation(id)
      setActiveConversation(conv)
    } catch (e) { /* ignore */ }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    try {
      await deleteConversation(id)
      removeConversation(id)
    } catch (e) { alert('Failed to delete') }
  }

  return (
    <aside className={clsx(
      'flex flex-col h-full bg-[#111] border-r border-[#1e1e1e] transition-all duration-200 flex-shrink-0',
      open ? 'w-60' : 'w-0 overflow-hidden border-r-0'
    )}>
      {/* Header */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1e1e1e] text-[#888] hover:text-white text-sm transition-colors border border-[#1e1e1e] hover:border-[#2a2a2a]"
        >
          <Plus size={15} />
          <span>New chat</span>
        </button>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-[#444] text-center mt-8">No conversations yet</p>
        ) : (
          <>
            <p className="text-[10px] text-[#444] uppercase tracking-widest px-2 mb-2 font-medium">Recent</p>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={clsx(
                  'w-full group flex items-start gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors mb-0.5',
                  activeConversationId === conv.id
                    ? 'bg-[#1e1e1e] text-white'
                    : 'text-[#666] hover:bg-[#181818] hover:text-[#ccc]'
                )}
              >
                <MessageSquare size={13} className="flex-shrink-0 mt-0.5 opacity-50" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[13px] leading-tight">{conv.title || 'New Chat'}</div>
                  <div className="text-[11px] text-[#444] mt-0.5">
                    {new Date(conv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#1e1e1e] flex-shrink-0 space-y-2">
        {/* Model selector */}
        <div className="flex items-center gap-1">
          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            className="flex-1 bg-[#1a1a1a] text-[#888] text-xs rounded-lg px-2 py-1.5 border border-[#2a2a2a] focus:outline-none focus:border-[#2affd4]/40 truncate"
          >
            {modelsLoading && <option>Loading…</option>}
            {models.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            {!modelsLoading && models.length === 0 && <option value="">No models</option>}
          </select>
          <button onClick={() => refetch()} className="p-1.5 hover:text-white text-[#444] transition-colors" title="Refresh">
            <RefreshCw size={11} />
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[#555] hover:text-white hover:bg-[#1e1e1e] transition-colors"
        >
          <Settings size={13} />
          Settings
        </button>
      </div>
    </aside>
  )
}
