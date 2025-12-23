import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl glass mr-auto max-w-[85%]">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-furon-gradient text-primary-foreground">
        <Bot size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">Furon AI</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-sm">Thinking</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>
    </div>
  );
}
