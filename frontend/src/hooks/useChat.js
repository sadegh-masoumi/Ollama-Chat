import { useRef, useCallback, useEffect } from 'react'
import useChatStore from '../store/chatStore'
import { getConversation } from '../api/client'

const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws/chat`

export function useChat() {
  const wsRef = useRef(null)
  const {
    activeConversationId,
    currentModel,
    settings,
    setIsStreaming,
    appendStreamingContent,
    setStreamingContent,
    addMessage,
    updateLastAssistantMessage,
    setActiveConversation,
    addConversation,
    conversations,
  } = useChatStore()

  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onclose = () => { wsRef.current = null }
    ws.onerror = () => { wsRef.current = null }
    return ws
  }, [])

  const stopGeneration = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsStreaming(false)
  }, [setIsStreaming])

  const sendMessage = useCallback(
    async (content, images = []) => {
      const ws = connectWs()
      if (!ws) return

      const store = useChatStore.getState()

      // Optimistically add user message to UI
      const userMsg = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        images: images.length ? images : undefined,
        created_at: new Date().toISOString(),
        conversation_id: store.activeConversationId,
      }
      addMessage(userMsg)

      // Placeholder for assistant message
      const assistantPlaceholder = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        conversation_id: store.activeConversationId,
        _streaming: true,
      }
      addMessage(assistantPlaceholder)

      setIsStreaming(true)
      setStreamingContent('')

      const payload = {
        conversation_id: store.activeConversationId,
        message: content,
        images: images.length ? images : undefined,
        model: store.currentModel,
        temperature: store.settings.temperature,
        top_p: store.settings.top_p,
        max_tokens: store.settings.max_tokens || undefined,
        system_prompt: store.settings.system_prompt || undefined,
      }

      let accumulatedContent = ''

      ws.onopen = () => {
        ws.send(JSON.stringify(payload))
      }

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'token') {
            accumulatedContent += msg.content
            appendStreamingContent(msg.content)
            // Update the placeholder in place
            updateLastAssistantMessage(accumulatedContent, null)
          } else if (msg.type === 'done') {
            setIsStreaming(false)
            setStreamingContent('')
            updateLastAssistantMessage(accumulatedContent, msg.token_count)

            // If new conversation was created, update store
            const convId = msg.conversation_id
            if (convId && convId !== store.activeConversationId) {
              useChatStore.setState({ activeConversationId: convId })
              // Fetch full conversation to get real message ids
              try {
                const conv = await getConversation(convId)
                useChatStore.getState().setActiveConversation(conv)
                useChatStore.getState().addConversation({ id: conv.id, title: conv.title, model: conv.model, created_at: conv.created_at, updated_at: conv.updated_at })
              } catch (e) { /* ignore */ }
            }
          } else if (msg.type === 'error') {
            setIsStreaming(false)
            updateLastAssistantMessage(`Error: ${msg.content}`, null)
          }
        } catch (e) { /* ignore parse errors */ }
      }

      ws.onerror = () => {
        setIsStreaming(false)
        updateLastAssistantMessage('Connection error. Is the backend running?', null)
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload))
      }
    },
    [connectWs, addMessage, setIsStreaming, appendStreamingContent, setStreamingContent, updateLastAssistantMessage]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  return { sendMessage, stopGeneration }
}
