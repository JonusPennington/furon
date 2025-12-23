import { ChevronDown, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LLM_PROVIDERS, ModelOption, ProviderKey, getModelById } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModelId: string | null;
  onModelChange: (modelId: string | null) => void;
  availableProviders: ProviderKey[];
}

export function ModelSelector({ selectedModelId, onModelChange, availableProviders }: ModelSelectorProps) {
  const selectedModel = selectedModelId ? getModelById(selectedModelId) : null;

  const getProviderStatus = (providerId: ProviderKey) => {
    return availableProviders.includes(providerId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 h-10 px-3 border-border/50 bg-secondary/30 hover:bg-secondary/50"
        >
          <Cpu className="h-4 w-4 text-primary" />
          <span className="text-sm max-w-[120px] truncate">
            {selectedModel ? selectedModel.name : 'Auto'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-72 p-0 bg-popover border-border z-50"
      >
        <div className="p-2 border-b border-border/50">
          <DropdownMenuLabel className="text-xs text-muted-foreground px-0">
            Select Model
          </DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => onModelChange(null)}
            className={cn(
              'cursor-pointer rounded-md',
              !selectedModelId && 'bg-primary/10'
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">Auto-select</span>
              <span className="text-xs text-muted-foreground">
                Smart routing based on your query
              </span>
            </div>
          </DropdownMenuItem>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {LLM_PROVIDERS.map((provider, index) => {
              const isAvailable = getProviderStatus(provider.id);
              
              return (
                <div key={provider.id} className={cn(index > 0 && "mt-2 pt-2 border-t border-border/30")}>
                  <DropdownMenuLabel className="text-xs flex items-center justify-between px-2 py-1">
                    <span className="font-semibold">{provider.name}</span>
                    {!isAvailable && (
                      <span className="text-destructive/70 font-normal text-[10px]">No key</span>
                    )}
                  </DropdownMenuLabel>
                  
                  {provider.models.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => isAvailable && onModelChange(model.id)}
                      disabled={!isAvailable}
                      className={cn(
                        'cursor-pointer ml-1 rounded-md',
                        selectedModelId === model.id && 'bg-primary/10',
                        !isAvailable && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
