import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useChatStore from './store/chatStore'
import { useChat } from './hooks/useChat'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import MessageInput from './components/MessageInput'
import ModelSettings from './components/ModelSettings'
import { getConversations } from './api/client'

export default function App() {
  const {
    darkMode, activeConversation, activeConversationId,
    setConversations, setActiveConversation, conversations,
  } = useChatStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { sendMessage, stopGeneration } = useChat()

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Load conversations on mount
  const { data } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 10_000,
  })
  useEffect(() => {
    if (data) setConversations(data)
  }, [data, setConversations])

  const handleNewChat = () => {
    setActiveConversation(null)
  }

  const handleSend = async (content, images) => {
    await sendMessage(content, images)
  }

  return (
    <div className="h-screen flex bg-gray-800 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 flex items-center px-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
          <h1 className="font-semibold text-gray-200 truncate">
            {activeConversation?.title || 'Ollama Chat'}
          </h1>
          {activeConversation?.model && (
            <span className="ml-2 text-xs text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded-full">
              {activeConversation.model}
            </span>
          )}
        </div>

        {/* Chat window */}
        <ChatWindow />

        {/* Input */}
        <MessageInput onSend={handleSend} onStop={stopGeneration} />
      </div>

      {/* Settings panel */}
      {settingsOpen && <ModelSettings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
