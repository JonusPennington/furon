import { useState } from 'react';
import { Brain, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThinkHarderButtonProps {
  onThinkHarder: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ThinkHarderButton({ onThinkHarder, isLoading, disabled }: ThinkHarderButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      onThinkHarder();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(false);
  };

  return (
    <div className="relative inline-flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          'gap-2 transition-all',
          isActive && 'bg-primary/10 border-primary/50 text-primary'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Brain className="w-4 h-4" />
        )}
        Think Harder
      </Button>
      {isActive && !isLoading && (
        <button
          onClick={handleClose}
          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}