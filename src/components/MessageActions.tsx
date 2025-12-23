import { useState } from 'react';
import { 
  RefreshCw, Copy, Check, Share2, ThumbsUp, ThumbsDown, 
  MoreHorizontal, Flag, Volume2, GitBranch, Plus, Minimize2, 
  Globe, Brain, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MessageActionsProps {
  content: string;
  conversationId?: string;
  onRegenerate?: (option: 'retry' | 'details' | 'condense' | 'search' | 'think') => void;
  onBranch?: () => void;
}

const REPORT_REASONS = [
  { id: 'violence', label: 'Violence & self-harm' },
  { id: 'sexual', label: 'Sexual exploitation & abuse' },
  { id: 'child', label: 'Child/teen exploitation' },
  { id: 'bullying', label: 'Bullying & harassment' },
  { id: 'spam', label: 'Spam, fraud & deception' },
  { id: 'privacy', label: 'Privacy violation' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'age', label: 'Age-inappropriate content' },
  { id: 'other', label: 'Something else' },
];

export function MessageActions({ 
  content, 
  conversationId,
  onRegenerate,
  onBranch,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ description: 'Message copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?conversation=${conversationId || 'shared'}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({ description: 'Link copied to clipboard' });
  };

  const handleLike = (type: 'up' | 'down') => {
    setLiked(prev => prev === type ? null : type);
    toast({ 
      description: type === 'up' ? 'Thanks for the feedback!' : 'Thanks for letting us know' 
    });
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleReport = () => {
    if (!reportReason) {
      toast({ description: 'Please select a reason', variant: 'destructive' });
      return;
    }
    // In a real app, send this to backend
    console.log('Report submitted:', { reason: reportReason, details: reportDetails });
    toast({ description: 'Report submitted. Thank you.' });
    setIsReportOpen(false);
    setReportReason('');
    setReportDetails('');
  };

  return (
    <>
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
        {/* Regenerate dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => onRegenerate?.('retry')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRegenerate?.('details')}>
              <Plus className="w-4 h-4 mr-2" />
              Add more details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRegenerate?.('condense')}>
              <Minimize2 className="w-4 h-4 mr-2" />
              Make it shorter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRegenerate?.('search')}>
              <Globe className="w-4 h-4 mr-2" />
              Search web
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRegenerate?.('think')}>
              <Brain className="w-4 h-4 mr-2" />
              Think harder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Copy */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>

        {/* Share */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={handleShare}
        >
          <Share2 className="w-3.5 h-3.5" />
        </Button>

        {/* Like/Dislike */}
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              'h-7 px-2 text-muted-foreground hover:text-foreground',
              liked === 'up' && 'text-green-500 hover:text-green-500'
            )}
            onClick={() => handleLike('up')}
          >
            <ThumbsUp className={cn('w-3.5 h-3.5', liked === 'up' && 'fill-current')} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              'h-7 px-2 text-muted-foreground hover:text-foreground',
              liked === 'down' && 'text-red-500 hover:text-red-500'
            )}
            onClick={() => handleLike('down')}
          >
            <ThumbsDown className={cn('w-3.5 h-3.5', liked === 'down' && 'fill-current')} />
          </Button>
        </div>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsReportOpen(true)}>
              <Flag className="w-4 h-4 mr-2" />
              Report response
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReadAloud}>
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking ? 'Stop reading' : 'Read aloud'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBranch}>
              <GitBranch className="w-4 h-4 mr-2" />
              Branch into new chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this response</DialogTitle>
            <DialogDescription>
              Why are you reporting this message?
            </DialogDescription>
          </DialogHeader>
          
          <RadioGroup value={reportReason} onValueChange={setReportReason} className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id} className="text-sm cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reportReason === 'other' && (
            <Textarea
              placeholder="Please provide more details..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="mt-2"
            />
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={!reportReason}>
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
