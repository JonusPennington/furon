import { useState, useMemo } from 'react';
import { Conversation, ChatMode, CHAT_MODES } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Link2, MessageSquare, Flame, Code2, FlaskConical, Search, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LinkChatDialogProps {
  conversations: Conversation[];
  currentMode: ChatMode;
  onInsertReference: (summary: string) => void;
  disabled?: boolean;
}

const modeIcons: Record<ChatMode, React.ReactNode> = {
  general: <MessageSquare className="w-4 h-4" />,
  innovation: <Flame className="w-4 h-4 text-orange-500" />,
  code: <Code2 className="w-4 h-4 text-emerald-500" />,
  research: <FlaskConical className="w-4 h-4" />,
};

const modeLabels: Record<ChatMode, string> = {
  general: 'General',
  innovation: 'Innovation',
  code: 'Prototype',
  research: 'Research',
};

function generateSummary(conversation: Conversation): string {
  const userMessages = conversation.messages.filter(m => m.role === 'user');
  const assistantMessages = conversation.messages.filter(m => m.role === 'assistant');
  
  // Extract key topics from user messages
  const topics = userMessages.slice(0, 3).map(m => {
    const cleaned = m.content.slice(0, 100).replace(/\n/g, ' ').trim();
    return cleaned.length < m.content.length ? `${cleaned}...` : cleaned;
  });

  // Get a snippet from the last assistant response
  const lastResponse = assistantMessages[assistantMessages.length - 1]?.content || '';
  const responseSnippet = lastResponse.slice(0, 200).replace(/\n/g, ' ').trim();

  return `**Referenced from "${conversation.title}" (${modeLabels[conversation.mode]} Mode)**

**Key Topics Discussed:**
${topics.map(t => `- ${t}`).join('\n')}

**Summary of Insights:**
${responseSnippet}${responseSnippet.length < lastResponse.length ? '...' : ''}

---
*Use this context to inform your response.*`;
}

export function LinkChatDialog({ 
  conversations, 
  currentMode, 
  onInsertReference,
  disabled 
}: LinkChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter out current mode's conversations and empty ones
  const otherModeConversations = useMemo(() => {
    return conversations.filter(c => 
      c.mode !== currentMode && 
      c.messages.length > 0 &&
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, currentMode, searchQuery]);

  // Group by mode
  const groupedConversations = useMemo(() => {
    const groups: Partial<Record<ChatMode, Conversation[]>> = {};
    otherModeConversations.forEach(conv => {
      if (!groups[conv.mode]) groups[conv.mode] = [];
      groups[conv.mode]!.push(conv);
    });
    return groups;
  }, [otherModeConversations]);

  const handleInsert = () => {
    if (!selectedConv) return;
    const summary = generateSummary(selectedConv);
    onInsertReference(summary);
    setOpen(false);
    setSelectedConv(null);
    setSearchQuery('');
  };

  const handleCopyReference = () => {
    if (!selectedConv) return;
    const summary = generateSummary(selectedConv);
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link2 className="w-3.5 h-3.5" />
          Link Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Reference a Previous Chat
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground">
          Import key points from another mode's conversation into your current chat.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px] border rounded-lg">
          <div className="p-2 space-y-3">
            {Object.keys(groupedConversations).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations from other modes found
              </p>
            ) : (
              Object.entries(groupedConversations).map(([mode, convs]) => (
                <div key={mode} className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    {modeIcons[mode as ChatMode]}
                    {modeLabels[mode as ChatMode]}
                    <span className="text-muted-foreground/50">({convs!.length})</span>
                  </div>
                  {convs!.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                        selectedConv?.id === conv.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-secondary/50'
                      )}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {conv.messages.length} messages
                        </p>
                      </div>
                      <ChevronRight className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform',
                        selectedConv?.id === conv.id && 'rotate-90'
                      )} />
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {selectedConv && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <p className="text-sm font-medium">{selectedConv.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedConv.messages.filter(m => m.role === 'user').length} questions · {selectedConv.messages.filter(m => m.role === 'assistant').length} responses
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyReference}
            disabled={!selectedConv}
            className="flex-1 gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Reference'}
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!selectedConv}
            className="flex-1 gap-2"
          >
            <Link2 className="w-4 h-4" />
            Insert as Context
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
