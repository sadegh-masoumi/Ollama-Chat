import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import useChatStore from '../store/chatStore'

export default function ChatWindow() {
  const { activeConversation, isStreaming } = useChatStore()
  const messages = activeConversation?.messages ?? []
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  if (!activeConversation && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center select-none px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-5">
          <Sparkles size={22} className="text-[#2affd4]" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">What can I help with?</h2>
        <p className="text-sm text-[#888]">Powered by Ollama · running locally</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && messages.length > 0 && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
