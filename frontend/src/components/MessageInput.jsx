import { useState, useRef, useCallback } from 'react'
import { Send, Square, Paperclip, X, ArrowUp } from 'lucide-react'
import clsx from 'clsx'
import { uploadFile } from '../api/client'
import useChatStore from '../store/chatStore'

export default function MessageInput({ onSend, onStop }) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const isStreaming = useChatStore((s) => s.isStreaming)

  const handleFiles = useCallback(async (files) => {
    setUploading(true)
    for (const file of files) {
      try {
        const result = await uploadFile(file)
        if (result.type === 'image') {
          setAttachments((prev) => [...prev, {
            type: 'image', name: file.name,
            data: result.base64,
            preview: `data:${result.mime_type};base64,${result.base64}`,
          }])
        } else {
          setAttachments((prev) => [...prev, { type: 'text', name: file.name, data: result.content, preview: null }])
          setText((t) => t + (t ? '\n\n' : '') + `[File: ${file.name}]\n${result.content}`)
        }
      } catch (e) {
        alert(`Failed to upload ${file.name}: ${e.message}`)
      }
    }
    setUploading(false)
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed && attachments.length === 0) return
    const images = attachments.filter((a) => a.type === 'image').map((a) => a.data)
    onSend(trimmed, images)
    setText('')
    setAttachments([])
  }, [text, attachments, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming) handleSend()
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) handleFiles(files)
  }

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData.items)
    const imgs = items.filter((i) => i.kind === 'file' && i.type.startsWith('image/'))
    if (imgs.length) handleFiles(imgs.map((i) => i.getAsFile()))
  }

  const hasContent = text.trim() || attachments.length > 0

  return (
    <div
      className={clsx(
        'rounded-2xl border transition-colors',
        dragOver
          ? 'border-[#2affd4]/40 bg-[#161616]'
          : 'border-[#2a2a2a] bg-[#161616] hover:border-[#333]',
        'focus-within:border-[#2affd4]/30'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((att, i) => (
            <div key={i} className="relative group">
              {att.type === 'image' ? (
                <img src={att.preview} alt={att.name}
                  className="h-14 w-14 object-cover rounded-lg border border-[#2a2a2a]" />
              ) : (
                <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-[#888]">
                  <Paperclip size={11} />
                  <span className="max-w-[100px] truncate">{att.name}</span>
                </div>
              )}
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-[#333] hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={9} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-1.5 text-[#999] hover:text-[#888] rounded-lg transition-colors flex-shrink-0 mb-0.5"
          title="Attach file"
        >
          <Paperclip size={17} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.pdf,.txt,.md,.py,.js,.jsx,.ts,.tsx,.json,.csv"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={dragOver ? 'Drop files here…' : 'Ask anything… / هر چیزی بپرسید'}
          disabled={isStreaming}
          dir="auto"
          rows={1}
          className={clsx(
            'flex-1 bg-transparent text-white text-[15px] resize-none',
            'placeholder-[#666] focus:outline-none',
            'max-h-48 overflow-y-auto leading-relaxed',
            isStreaming && 'opacity-50 cursor-not-allowed'
          )}
          style={{ minHeight: '28px' }}
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-white transition-colors flex-shrink-0 mb-0.5"
            title="Stop"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!hasContent}
            className={clsx(
              'w-8 h-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 mb-0.5',
              hasContent
                ? 'bg-[#2affd4] hover:bg-[#20e8be] text-black'
                : 'bg-[#1e1e1e] text-[#999] cursor-not-allowed'
            )}
            title="Send"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>

      {/* Hint */}
      <div className="px-4 pb-2.5 flex items-center gap-3">
        <span className="text-[11px] text-[#333]">Enter to send · Shift+Enter for newline</span>
      </div>
    </div>
  )
}
