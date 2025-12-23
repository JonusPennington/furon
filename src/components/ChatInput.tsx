import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceControls } from './VoiceControls';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  variant?: 'default' | 'innovation';
  lastAssistantMessage?: string;
}

export function ChatInput({ 
  onSend, 
  isLoading, 
  placeholder = 'Ask Furon AI anything...', 
  variant = 'default',
  lastAssistantMessage 
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInnovation = variant === 'innovation';

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + transcript);
    textareaRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  return (
    <div className={cn(
      'relative rounded-full px-4 py-2 transition-all',
      isInnovation 
        ? 'bg-orange-950/40 border border-orange-500/30 backdrop-blur-xl' 
        : 'glass-strong'
    )}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center">
          <VoiceControls 
            onTranscript={handleVoiceTranscript}
            variant={variant}
          />
        </div>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'flex-1 min-h-[44px] max-h-[44px] resize-none border-0 bg-transparent flex items-center',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'py-0 px-2 leading-[44px]',
            isInnovation 
              ? 'text-orange-100 placeholder:text-orange-400/50' 
              : 'text-foreground placeholder:text-muted-foreground'
          )}
          rows={1}
        />
        <div className="flex items-center justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className={cn(
              'h-10 w-10 rounded-full shrink-0 transition-all',
              'disabled:opacity-50',
              isInnovation
                ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 shadow-lg shadow-orange-500/30'
                : 'bg-furon-gradient hover:opacity-90'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isInnovation ? (
              <Flame className="h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
