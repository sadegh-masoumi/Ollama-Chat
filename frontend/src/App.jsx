import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useChatStore from './store/chatStore'
import { useChat } from './hooks/useChat'
import { useModels } from './hooks/useModels'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import MessageInput from './components/MessageInput'
import ModelSettings from './components/ModelSettings'
import { getConversations } from './api/client'

export default function App() {
  const { activeConversation, setConversations, setActiveConversation } = useChatStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { sendMessage, stopGeneration } = useChat()
  const { models } = useModels()

  useEffect(() => {
    if (models.length > 0) {
      const available = models.map((m) => m.name)
      if (!available.includes(useChatStore.getState().currentModel)) {
        useChatStore.getState().setCurrentModel(available[0])
      }
    }
  }, [models])

  const { data } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 10_000,
  })
  useEffect(() => {
    if (data) setConversations(data)
  }, [data, setConversations])

  return (
    <div className="h-screen flex bg-[#0d0d0d] text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onNewChat={() => setActiveConversation(null)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="h-12 flex items-center px-4 gap-3 border-b border-[#1e1e1e] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-[#666] hover:text-white transition-colors"
            title="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {activeConversation?.title && (
            <span className="text-sm text-[#666] truncate">{activeConversation.title}</span>
          )}
        </div>

        {/* Chat area */}
        <ChatWindow />

        {/* Input pinned at bottom */}
        <div className="flex-shrink-0 px-4 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <MessageInput onSend={sendMessage} onStop={stopGeneration} />
          </div>
        </div>
      </div>

      {settingsOpen && <ModelSettings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
