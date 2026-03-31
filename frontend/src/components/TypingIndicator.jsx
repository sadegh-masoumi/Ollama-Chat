export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
        AI
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
