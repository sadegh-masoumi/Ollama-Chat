import { useState, useRef, useCallback } from 'react'
import { Send, Square, Paperclip, X, Image } from 'lucide-react'
import clsx from 'clsx'
import { uploadFile } from '../api/client'
import useChatStore from '../store/chatStore'

export default function MessageInput({ onSend, onStop }) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([]) // [{type, name, data, preview}]
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
            type: 'image',
            name: file.name,
            data: result.base64,
            preview: `data:${result.mime_type};base64,${result.base64}`,
          }])
        } else {
          setAttachments((prev) => [...prev, {
            type: 'text',
            name: file.name,
            data: result.content,
            preview: null,
          }])
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
    const imageItems = items.filter((i) => i.kind === 'file' && i.type.startsWith('image/'))
    if (imageItems.length) {
      const files = imageItems.map((i) => i.getAsFile())
      handleFiles(files)
    }
  }

  return (
    <div
      className={clsx(
        'border-t border-gray-700 bg-gray-800 p-4 transition-colors',
        dragOver && 'bg-gray-700'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((att, i) => (
            <div key={i} className="relative group">
              {att.type === 'image' ? (
                <img src={att.preview} alt={att.name}
                  className="h-16 w-16 object-cover rounded-lg border border-gray-600" />
              ) : (
                <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
                  <Image size={14} />
                  <span className="max-w-[120px] truncate">{att.name}</span>
                </div>
              )}
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          title="Attach file or image"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.pdf,.txt,.md,.py,.js,.jsx,.ts,.tsx,.json,.csv"
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={dragOver ? 'Drop files here…' : 'Message (Enter to send, Shift+Enter for newline)'}
          disabled={isStreaming}
          rows={1}
          className={clsx(
            'flex-1 bg-gray-700 text-gray-100 rounded-xl px-4 py-3 text-sm resize-none',
            'placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            'max-h-40 overflow-y-auto',
            isStreaming && 'opacity-60 cursor-not-allowed'
          )}
          style={{ minHeight: '48px' }}
        />

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-xl text-white transition-colors flex-shrink-0"
            title="Stop generation"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() && attachments.length === 0}
            className={clsx(
              'p-3 rounded-xl text-white transition-colors flex-shrink-0',
              text.trim() || attachments.length
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            )}
            title="Send message"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
