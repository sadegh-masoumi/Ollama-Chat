export default function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[#2affd4]">AI</span>
      </div>
      <div className="flex items-center gap-1.5 py-2">
        <span className="w-1.5 h-1.5 bg-[#2affd4] rounded-full animate-bounce [animation-delay:0ms] opacity-60" />
        <span className="w-1.5 h-1.5 bg-[#2affd4] rounded-full animate-bounce [animation-delay:150ms] opacity-60" />
        <span className="w-1.5 h-1.5 bg-[#2affd4] rounded-full animate-bounce [animation-delay:300ms] opacity-60" />
      </div>
    </div>
  )
}
