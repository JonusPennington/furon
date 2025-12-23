import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReasoningDisplayProps {
  reasoning: string;
  isStreaming?: boolean;
}

export function ReasoningDisplay({ reasoning, isStreaming }: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Parse reasoning into steps
  const steps = reasoning.split(/(?=Step \d+:|(?:\n\n)(?=[A-Z]))/).filter(Boolean);

  return (
    <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Chain of Thought</span>
          {isStreaming && (
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={cn(
                'flex gap-3 text-sm animate-in fade-in slide-in-from-left-2',
                isStreaming && index === steps.length - 1 && 'opacity-80'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                {index + 1}
              </div>
              <div className="flex-1 pt-0.5 text-muted-foreground">
                {step.trim()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}