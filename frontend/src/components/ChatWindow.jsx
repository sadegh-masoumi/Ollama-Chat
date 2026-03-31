import { useEffect, useRef } from 'react'
import { Bot } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import useChatStore from '../store/chatStore'

export default function ChatWindow() {
  const { activeConversation, isStreaming } = useChatStore()
  const messages = activeConversation?.messages ?? []
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  if (!activeConversation && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 select-none">
        <Bot size={56} className="mb-4 text-gray-600" />
        <p className="text-xl font-semibold text-gray-400">Ollama Chat</p>
        <p className="text-sm mt-1">Select a model and start a conversation</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && messages.length > 0 && messages[messages.length - 1]?.content === '' && (
        <TypingIndicator />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
