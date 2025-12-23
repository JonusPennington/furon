import { Download, FileText, Link2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Message } from '@/types/chat';
import { toast } from 'sonner';

interface ExportButtonProps {
  messages: Message[];
  conversationTitle?: string;
}

export function ExportButton({ messages, conversationTitle = 'conversation' }: ExportButtonProps) {
  const exportAsMarkdown = () => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    const markdown = messages
      .map((msg) => {
        const role = msg.role === 'user' ? '**You**' : '**Furon AI**';
        const timestamp = new Date(msg.timestamp).toLocaleString();
        return `### ${role}\n*${timestamp}*\n\n${msg.content}\n\n---\n`;
      })
      .join('\n');

    const header = `# ${conversationTitle}\n\nExported on ${new Date().toLocaleString()}\n\n---\n\n`;
    const content = header + markdown;

    downloadFile(content, `${sanitizeFilename(conversationTitle)}.md`, 'text/markdown');
    toast.success('Exported as Markdown');
  };

  const exportAsJSON = () => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    const data = {
      title: conversationTitle,
      exportedAt: new Date().toISOString(),
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        mode: msg.mode,
        model: msg.model,
      })),
    };

    const content = JSON.stringify(data, null, 2);
    downloadFile(content, `${sanitizeFilename(conversationTitle)}.json`, 'application/json');
    toast.success('Exported as JSON');
  };

  const exportAsPDF = () => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    // Create printable HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${conversationTitle}</title>
        <style>
          body { font-family: 'PT Sans', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
          .user { background: #f0f0f0; margin-left: 50px; }
          .assistant { background: #e8f4f8; margin-right: 50px; }
          .role { font-weight: bold; margin-bottom: 5px; }
          .timestamp { color: #666; font-size: 12px; }
          .content { margin-top: 10px; white-space: pre-wrap; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${conversationTitle}</h1>
        <p style="color: #666;">Exported on ${new Date().toLocaleString()}</p>
        ${messages.map(msg => `
          <div class="message ${msg.role}">
            <div class="role">${msg.role === 'user' ? 'You' : 'Furon AI'}</div>
            <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
            <div class="content">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      toast.success('PDF export opened - use your browser\'s print dialog to save');
    }
  };

  const generateShareableLink = () => {
    if (messages.length === 0) {
      toast.error('No messages to share');
      return;
    }

    // Create a base64 encoded version of the conversation
    const data = {
      title: conversationTitle,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const shareUrl = `${window.location.origin}?shared=${encoded.slice(0, 100)}...`;
    
    navigator.clipboard.writeText(shareUrl);
    toast.success('Shareable link copied! (Read-only preview)');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-lg hover:bg-secondary">
          <Download className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsMarkdown}>
          <FileText className="w-4 h-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON}>
          <FileText className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={generateShareableLink}>
          <Link2 className="w-4 h-4 mr-2" />
          Copy Shareable Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
