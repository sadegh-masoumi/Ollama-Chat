import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, RefreshCw, Edit2 } from 'lucide-react'
import clsx from 'clsx'

function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return (
    <button onClick={copy} className={clsx('p-1 rounded hover:bg-gray-600 transition-colors', className)}>
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  )
}

function CodeBlock({ children, className }) {
  const language = /language-(\w+)/.exec(className || '')?.[1] || 'text'
  const code = String(children).replace(/\n$/, '')
  return (
    <div className="relative group my-2 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-900 px-3 py-1.5 text-xs text-gray-400">
        <span>{language}</span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.85em' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function MessageBubble({ message, onRegenerate, onEdit }) {
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)

  const handleEdit = () => {
    if (editing && onEdit) {
      onEdit(message.id, editText)
    }
    setEditing(!editing)
  }

  return (
    <div className={clsx('group flex items-start gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
        isUser ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble */}
      <div className={clsx(
        'relative max-w-[80%] rounded-2xl px-4 py-3',
        isUser
          ? 'bg-blue-600 text-white rounded-tr-sm'
          : 'bg-gray-700 text-gray-100 rounded-tl-sm'
      )}>
        {/* Images preview */}
        {message.images?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images.map((img, i) => (
              <img key={i} src={`data:image/jpeg;base64,${img}`} alt="attachment"
                className="max-h-40 rounded-lg object-contain" />
            ))}
          </div>
        )}

        {/* Content */}
        {editing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-transparent border border-white/30 rounded p-1 text-sm resize-none focus:outline-none min-w-[200px]"
            rows={3}
            autoFocus
          />
        ) : isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose-chat text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  if (inline) return <code className={className} {...props}>{children}</code>
                  return <CodeBlock className={className}>{children}</CodeBlock>
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Token count */}
        {message.token_count && (
          <div className="text-xs text-gray-400 mt-1">{message.token_count} tokens</div>
        )}
      </div>

      {/* Action buttons */}
      <div className={clsx(
        'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center',
        isUser ? 'flex-row-reverse' : ''
      )}>
        <CopyButton text={message.content} className="text-gray-500" />
        {isUser && (
          <button onClick={handleEdit} className="p-1 rounded hover:bg-gray-700 transition-colors">
            <Edit2 size={14} className="text-gray-500" />
          </button>
        )}
        {!isUser && onRegenerate && (
          <button onClick={() => onRegenerate(message.id)} className="p-1 rounded hover:bg-gray-700 transition-colors">
            <RefreshCw size={14} className="text-gray-500" />
          </button>
        )}
      </div>
    </div>
  )
}
