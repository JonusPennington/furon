import { INNOVATION_TOOLS } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface InnovationToolsProps {
  onToolSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function InnovationTools({ onToolSelect, disabled }: InnovationToolsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-4 border-b border-orange-500/30 bg-gradient-to-r from-orange-950/20 to-red-950/20">
      <div className="flex items-center gap-2 mr-2">
        <Zap className="w-4 h-4 text-orange-400" />
        <span className="text-sm text-orange-400 font-medium">Quick Actions:</span>
      </div>
      {INNOVATION_TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolSelect(tool.prompt)}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30',
            'border border-orange-500/30 hover:border-orange-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center gap-1.5',
            'shadow-sm hover:shadow-orange-500/20'
          )}
        >
          <span>{tool.icon}</span>
          <span>{tool.label}</span>
        </button>
      ))}
    </div>
  );
}
