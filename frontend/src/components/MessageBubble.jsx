import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

function CopyButton({ text, size = 13 }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[#555] hover:text-white hover:bg-[#1e1e1e] transition-colors text-xs"
      title="Copy"
    >
      {copied
        ? <><Check size={size} className="text-[#2affd4]" /><span>Copied</span></>
        : <><Copy size={size} /><span>Copy</span></>
      }
    </button>
  )
}

function CodeBlock({ children, className }) {
  const language = /language-(\w+)/.exec(className || '')?.[1] || 'text'
  const code = String(children).replace(/\n$/, '')
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#2a2a2a]">
      <div className="flex items-center justify-between bg-[#161616] px-4 py-2">
        <span className="text-xs text-[#2affd4]/60 font-mono">{language}</span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.82em', background: '#0d0d0d', padding: '1rem' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function MessageBubble({ message, onRegenerate }) {
  const isUser = message.role === 'user'

  return (
    <div className="group">
      {isUser ? (
        /* ── User message ── */
        <div className="flex justify-end">
          <div className="max-w-[75%]">
            {message.images?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {message.images.map((img, i) => (
                  <img key={i} src={`data:image/jpeg;base64,${img}`} alt="attachment"
                    className="max-h-48 rounded-xl object-contain border border-[#2a2a2a]" />
                ))}
              </div>
            )}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] text-[#e8e8e8] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
        </div>
      ) : (
        /* ── Assistant message ── */
        <div className="flex gap-3">
          {/* Icon */}
          <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-[#2affd4]">AI</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="prose-chat text-[15px]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    if (inline) return (
                      <code className="bg-[#1e1e1e] text-[#2affd4] px-1.5 py-0.5 rounded text-[0.82em] font-mono border border-[#2a2a2a]" {...props}>
                        {children}
                      </code>
                    )
                    return <CodeBlock className={className}>{children}</CodeBlock>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[#555] hover:text-white hover:bg-[#1e1e1e] transition-colors text-xs"
                >
                  <RefreshCw size={13} /><span>Regenerate</span>
                </button>
              )}
              {message.token_count && (
                <span className="text-xs text-[#444] ml-1">{message.token_count} tokens</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
