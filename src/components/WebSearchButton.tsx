import { useState } from 'react';
import { Globe, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface WebSearchButtonProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  variant?: 'default' | 'innovation';
}

export function WebSearchButton({ onSearch, isSearching, variant = 'default' }: WebSearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isInnovation = variant === 'innovation';

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isSearching}
          className={cn(
            'h-10 w-10 rounded-xl transition-all',
            isInnovation 
              ? 'text-orange-400 hover:bg-orange-500/20' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Globe className="w-5 h-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Web Search</h4>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Search the web for fresh data and recent information
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="What do you want to search?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!query.trim() || isSearching}>
              Search
            </Button>
          </div>
          <div className="text-xs text-muted-foreground/70">
            Pro tip: Use in Research mode to auto-pull papers & patents
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}