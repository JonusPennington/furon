import { ChatMode, CHAT_MODES } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Flame, Code2, MessageSquare, FlaskConical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const modeIcons: Record<ChatMode, React.ReactNode> = {
  general: <MessageSquare className="w-4 h-4" />,
  innovation: <Flame className="w-4 h-4" />,
  code: <Code2 className="w-4 h-4" />,
  research: <FlaskConical className="w-4 h-4" />,
};

const modeColors: Record<ChatMode, string> = {
  general: '',
  innovation: 'text-orange-500',
  code: 'text-emerald-500',
  research: '',
};

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const currentModeData = CHAT_MODES.find(m => m.id === currentMode);
  
  return (
    <Select value={currentMode} onValueChange={(value) => onModeChange(value as ChatMode)}>
      <SelectTrigger className={cn(
        'w-[140px] border-none bg-secondary/50 hover:bg-secondary',
        modeColors[currentMode]
      )}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {modeIcons[currentMode]}
            <span>{currentModeData?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CHAT_MODES.map((mode) => (
          <SelectItem key={mode.id} value={mode.id}>
            <div className={cn('flex items-center gap-2', modeColors[mode.id])}>
              {modeIcons[mode.id]}
              <span>{mode.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
