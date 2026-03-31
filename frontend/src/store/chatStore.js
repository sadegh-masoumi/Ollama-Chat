import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      activeConversation: null,
      isStreaming: false,
      streamingContent: '',
      currentModel: 'qwen2.5:14b',
      settings: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: null,
        system_prompt: '',
      },
      darkMode: true,

      setConversations: (conversations) => set({ conversations }),

      addConversation: (conv) =>
        set((s) => ({ conversations: [conv, ...s.conversations] })),

      removeConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
          activeConversation: s.activeConversationId === id ? null : s.activeConversation,
        })),

      setActiveConversation: (conv) =>
        set({ activeConversation: conv, activeConversationId: conv?.id ?? null }),

      setActiveConversationId: (id) => set({ activeConversationId: id }),

      addMessage: (message) =>
        set((s) => {
          const conv = s.activeConversation || { id: null, title: '', messages: [] }
          return {
            activeConversation: {
              ...conv,
              messages: [...(conv.messages || []), message],
            },
          }
        }),

      updateLastAssistantMessage: (content, tokenCount) =>
        set((s) => {
          if (!s.activeConversation) return {}
          const messages = [...(s.activeConversation.messages || [])]
          const lastIdx = messages.length - 1
          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            messages[lastIdx] = {
              ...messages[lastIdx],
              content,
              token_count: tokenCount,
            }
          }
          return { activeConversation: { ...s.activeConversation, messages } }
        }),

      appendStreamingContent: (token) =>
        set((s) => ({ streamingContent: s.streamingContent + token })),

      setStreamingContent: (content) => set({ streamingContent: content }),

      setIsStreaming: (val) => set({ isStreaming: val }),

      setCurrentModel: (model) => set({ currentModel: model }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      updateConversationTitle: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
          activeConversation:
            s.activeConversation?.id === id
              ? { ...s.activeConversation, title }
              : s.activeConversation,
        })),
    }),
    {
      name: 'ollama-chat-store',
      partialize: (s) => ({
        currentModel: s.currentModel,
        settings: s.settings,
        darkMode: s.darkMode,
      }),
    }
  )
)

export default useChatStore
