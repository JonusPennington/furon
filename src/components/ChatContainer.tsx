import { useRef, useEffect, useState } from 'react';
import { Message as MessageType, ChatMode, Conversation } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { InnovationTools } from './InnovationTools';
import { TypingIndicator } from './TypingIndicator';
import { ThinkHarderButton } from './ThinkHarderButton';
import { WebSearchButton } from './WebSearchButton';
import { LinkChatDialog } from './LinkChatDialog';
import { Flame, Zap, Eye, EyeOff, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import furonLogo from '@/assets/furon-logo.png';

interface ChatContainerProps {
  messages: MessageType[];
  mode: ChatMode;
  isLoading: boolean;
  streamingContent?: string;
  streamingReasoning?: string;
  showReasoning?: boolean;
  onToggleReasoning?: () => void;
  onSendMessage: (content: string) => void;
  onThinkHarder?: () => void;
  onWebSearch?: (query: string) => void;
  isSearching?: boolean;
  conversationId?: string;
  onBranchChat?: () => void;
  allConversations?: Conversation[];
}

interface EmptyStateProps {
  mode: ChatMode;
}

export function ChatContainer({ 
  messages, 
  mode, 
  isLoading, 
  streamingContent, 
  streamingReasoning,
  showReasoning,
  onToggleReasoning,
  onSendMessage,
  onThinkHarder,
  onWebSearch,
  isSearching,
  conversationId,
  onBranchChat,
  allConversations = [],
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [linkedContext, setLinkedContext] = useState<string | null>(null);
  const isInnovation = mode === 'innovation';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const placeholder = 'Ask anything';

  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
  const canThinkHarder = lastAssistantMessage && !isLoading;

  return (
    <div className={cn(
      'flex flex-col h-full transition-all duration-300',
      isInnovation && 'bg-gradient-to-b from-orange-950/20 to-transparent'
    )}>
      {/* Innovation Mode Banner */}
      {isInnovation && messages.length === 0 && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <div className="flex items-center gap-2 text-orange-400">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Wartime Intensity Mode Active</span>
          </div>
          <p className="text-xs text-orange-300/70 mt-1">
            Pushing for breakthroughs in AI/ML, space, biotech, energy, and quantum. Every response includes bold variations, POC roadmaps, and "what if" questions.
          </p>
        </div>
      )}

      {/* Innovation Tools - only show in innovation mode */}
      {isInnovation && (
        <InnovationTools onToolSelect={onSendMessage} disabled={isLoading} />
      )}

      {/* Toolbar with Link Chat and Mode-specific options */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border/30">
        <LinkChatDialog
          conversations={allConversations}
          currentMode={mode}
          onInsertReference={(summary) => setLinkedContext(summary)}
          disabled={isLoading}
        />
        {messages.length > 0 && isInnovation && onToggleReasoning && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleReasoning}
            className={cn(
              'gap-2 text-xs',
              showReasoning && 'bg-primary/10 text-primary'
            )}
          >
            {showReasoning ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Show Reasoning
          </Button>
        )}
        {linkedContext && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">
            <Link2 className="w-3 h-3" />
            <span>Context linked</span>
            <button 
              onClick={() => setLinkedContext(null)}
              className="hover:text-primary/70"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <EmptyState mode={mode} />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                showReasoning={showReasoning && mode === 'innovation'}
                conversationId={conversationId}
                onRegenerate={(option) => {
                  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
                  if (!lastUserMsg) return;
                  
                  if (option === 'retry') {
                    onSendMessage(lastUserMsg.content);
                  } else if (option === 'details') {
                    onSendMessage(`${lastUserMsg.content} - please provide more details and examples`);
                  } else if (option === 'condense') {
                    onSendMessage(`${lastUserMsg.content} - please give a shorter, more concise answer`);
                  } else if (option === 'search') {
                    onWebSearch?.(lastUserMsg.content);
                  } else if (option === 'think') {
                    onThinkHarder?.();
                  }
                }}
                onBranch={onBranchChat}
              />
            ))}
            {/* Typing indicator while waiting */}
            {isLoading && !streamingContent && (
              <TypingIndicator />
            )}
            {/* Streaming message */}
            {streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingContent,
                  mode,
                  timestamp: new Date(),
                  reasoning: streamingReasoning,
                }}
                isStreaming
                showReasoning={showReasoning && mode === 'innovation'}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={cn(
        'p-4 border-t transition-all',
        isInnovation 
          ? 'border-orange-500/30 bg-gradient-to-t from-orange-950/10 to-transparent' 
          : 'border-border/50'
      )}>
        <ChatInput
          onSend={(content) => {
            // If there's linked context, prepend it to the message
            if (linkedContext) {
              onSendMessage(`${linkedContext}\n\n---\n\n${content}`);
              setLinkedContext(null);
            } else {
              onSendMessage(content);
            }
          }}
          isLoading={isLoading}
          placeholder={linkedContext ? 'Ask about the linked context...' : placeholder}
          variant={isInnovation ? 'innovation' : 'default'}
          lastAssistantMessage={lastAssistantMessage?.content}
        />
      </div>
    </div>
  );
}

function EmptyState({ mode }: EmptyStateProps) {
  const isInnovation = mode === 'innovation';

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative">
        {isInnovation ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 blur-3xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Flame className="w-10 h-10 text-white animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-furon-gradient blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
              <img 
                src={furonLogo} 
                alt="Furon Logo" 
                className="w-12 h-12 object-contain dark:invert-0 invert"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}