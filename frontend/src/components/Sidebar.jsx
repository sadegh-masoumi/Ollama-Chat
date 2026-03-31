import { useState } from 'react'
import { Plus, Trash2, MessageSquare, Settings, Sun, Moon, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import useChatStore from '../store/chatStore'
import { useModels } from '../hooks/useModels'
import { deleteConversation, getConversation } from '../api/client'

export default function Sidebar({ onNewChat, onOpenSettings }) {
  const {
    conversations, activeConversationId, setActiveConversation,
    removeConversation, currentModel, setCurrentModel, darkMode, toggleDarkMode,
  } = useChatStore()
  const { models, isLoading: modelsLoading, refetch } = useModels()

  const handleSelectConversation = async (id) => {
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
    } catch (e) { alert('Failed to delete conversation') }
  }

  return (
    <div className="w-64 h-full flex flex-col bg-gray-900 border-r border-gray-700">
      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-600 text-center mt-6">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={clsx(
                'w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors mb-0.5',
                activeConversationId === conv.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <MessageSquare size={14} className="flex-shrink-0" />
              <span className="flex-1 truncate">{conv.title || 'New Chat'}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </button>
          ))
        )}
      </div>

      {/* Model selector */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center gap-1 mb-1">
          <label className="text-xs text-gray-500 flex-1">Model</label>
          <button onClick={() => refetch()} className="p-0.5 hover:text-gray-300 text-gray-600 transition-colors" title="Refresh models">
            <RefreshCw size={11} />
          </button>
        </div>
        <select
          value={currentModel}
          onChange={(e) => setCurrentModel(e.target.value)}
          className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {modelsLoading && <option>Loading…</option>}
          {models.map((m) => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
          {!modelsLoading && models.length === 0 && (
            <option value="">No models found</option>
          )}
        </select>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between px-3 pb-3">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Settings size={14} />
          Settings
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  )
}
