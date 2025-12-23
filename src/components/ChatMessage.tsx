import { Message as MessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import { User, Bot, Brain } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ReasoningDisplay } from './ReasoningDisplay';
import { MessageActions } from './MessageActions';
import { Copy, Check } from 'lucide-react';

export interface ChatMessageProps {
  message: MessageType;
  isStreaming?: boolean;
  showReasoning?: boolean;
  conversationId?: string;
  onRegenerate?: (option: 'retry' | 'details' | 'condense' | 'search' | 'think') => void;
  onBranch?: () => void;
}

export function ChatMessage({ 
  message, 
  isStreaming, 
  showReasoning,
  conversationId,
  onRegenerate,
  onBranch,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex p-4 rounded-2xl transition-all',
        isUser 
          ? 'bg-primary/10 border border-primary/20 ml-auto max-w-[75%] w-fit' 
          : 'bg-background/50 mr-auto max-w-[85%]',
        message.isThinkHarder && !isUser && 'border border-primary/30 bg-primary/5'
      )}
    >
      <div className="flex-1 min-w-0">
        {message.isThinkHarder && !isUser && (
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
              Deep Think
            </span>
          </div>
        )}
        
        {/* Show reasoning if available and enabled */}
        {showReasoning && message.reasoning && !isUser && (
          <ReasoningDisplay reasoning={message.reasoning} isStreaming={isStreaming} />
        )}
        
        <div className={cn(
          'prose prose-sm max-w-none dark:prose-invert',
          isUser && 'text-right'
        )}>
          <MessageContent content={message.content} mode={message.mode} />
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
          )}
        </div>

        {/* Message actions for assistant messages */}
        {!isUser && !isStreaming && (
          <MessageActions 
            content={message.content}
            conversationId={conversationId}
            onRegenerate={onRegenerate}
            onBranch={onBranch}
          />
        )}
      </div>
    </div>
  );
}

interface MessageContentProps {
  content: string;
  mode?: string;
}

function MessageContent({ content, mode }: MessageContentProps) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <CodeBlock 
                key={i} 
                code={code.trim()} 
                language={lang || 'typescript'} 
                showPreview={mode === 'code' && (lang === 'tsx' || lang === 'jsx')}
              />
            );
          }
        }

        // Handle bold text
        const formatted = part.split(/(\*\*.*?\*\*)/g).map((segment, j) => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return (
              <strong key={j} className="text-foreground font-semibold">
                {segment.slice(2, -2)}
              </strong>
            );
          }
          return segment;
        });

        return (
          <p key={i} className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {formatted}
          </p>
        );
      })}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  showPreview?: boolean;
}

function CodeBlock({ code, language, showPreview }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border/50">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-background/80 border-b border-border/50">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Code */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'hsl(var(--background) / 0.5)',
          fontSize: '0.875rem',
        }}
        showLineNumbers
        lineNumberStyle={{
          color: 'hsl(var(--muted-foreground) / 0.4)',
          paddingRight: '1rem',
          minWidth: '2.5rem',
        }}
      >
        {code}
      </SyntaxHighlighter>

      {/* Static Component Preview */}
      {showPreview && (
        <div className="border-t border-border/50">
          <div className="px-4 py-2 bg-background/80 border-b border-border/50">
            <span className="text-xs font-medium text-primary">Preview</span>
          </div>
          <div className="p-4 bg-card/50">
            <StaticComponentPreview />
          </div>
        </div>
      )}
    </div>
  );
}

// Static preview of common UI components
function StaticComponentPreview() {
  return (
    <div className="space-y-4">
      {/* Sample Dashboard Layout */}
      <div className="grid grid-cols-3 gap-3">
        {/* Stat Cards */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <div className="text-xs text-muted-foreground">Total Users</div>
          <div className="text-xl font-bold text-foreground">12,847</div>
          <div className="text-xs text-green-400">+12.5%</div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
          <div className="text-xs text-muted-foreground">Revenue</div>
          <div className="text-xl font-bold text-foreground">$84.2K</div>
          <div className="text-xs text-green-400">+8.1%</div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-neon-green/20 to-neon-green/5 border border-neon-green/20">
          <div className="text-xs text-muted-foreground">Active Now</div>
          <div className="text-xl font-bold text-foreground">1,429</div>
          <div className="text-xs text-muted-foreground">Live</div>
        </div>
      </div>

      {/* Sample Chart Placeholder */}
      <div className="h-24 rounded-lg bg-gradient-to-t from-primary/20 to-transparent border border-border/50 flex items-end justify-around px-2 pb-2">
        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75].map((height, i) => (
          <div
            key={i}
            className="w-4 bg-gradient-to-t from-primary to-primary/50 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* Sample Form Elements */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground"
          disabled
        />
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground">
          Search
        </button>
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground border border-border/50">
          Filter
        </button>
      </div>
    </div>
  );
}
