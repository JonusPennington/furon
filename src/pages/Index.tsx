import { useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { BuckeyeLeafLogo } from '@/components/BuckeyeLeafLogo';
import { ModeSelector } from '@/components/ModeSelector';
import { ChatContainer } from '@/components/ChatContainer';
import { ProjectsSidebar } from '@/components/ProjectsSidebar';
import { ModelSelector } from '@/components/ModelSelector';
import { ExportButton } from '@/components/ExportButton';
import { Button } from '@/components/ui/button';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { useChat } from '@/hooks/useChat';
import { usePreferences } from '@/hooks/usePreferences';
import { useCustomModels } from '@/hooks/useCustomModels';
import { ChatMode } from '@/types/chat';
import { sendMessage } from '@/lib/llm-router';
import { cn } from '@/lib/utils';

export default function Index() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const { apiKeys, updateApiKey, clearApiKey, getAvailableProviders } = useAPIKeys();
  const { preferences, toggleTheme, setSelectedModel, updatePreferences } = usePreferences();
  const { 
    customModels, 
    addCustomModel, 
    updateCustomModel, 
    deleteCustomModel, 
    reorderCustomModels 
  } = useCustomModels();
  const { 
    conversations,
    folders,
    projects,
    currentConversation, 
    currentConversationId,
    currentMode,
    isLoading, 
    isHydrated,
    setIsLoading,
    setMode,
    ensureConversation,
    addMessage,
    deleteConversation,
    switchConversation,
    startNewChat,
    toggleBookmark,
    moveToFolder,
    createFolder,
    deleteFolder,
    renameFolder,
    createProject,
    deleteProject,
    clearAllConversations,
  } = useChat();

  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');

  const handleSendMessage = async (content: string, isThinkHarder = false) => {
    let convId = currentConversationId;
    if (!convId || !currentConversation) {
      const newConv = ensureConversation(currentMode);
      convId = newConv.id;
    }

    addMessage(content, 'user', currentMode);
    setIsLoading(true);
    setStreamingContent('');
    setStreamingReasoning('');

    // Add reasoning prefix for innovation mode
    const enhancedContent = isThinkHarder 
      ? `[THINK HARDER] Analyze this more deeply with step-by-step reasoning: ${content}`
      : currentMode === 'innovation' && preferences.showReasoning
        ? `Show your reasoning step-by-step before the final answer. ${content}`
        : content;

    try {
      await sendMessage({
        message: enhancedContent,
        mode: currentMode,
        apiKeys,
        selectedModelId: preferences.selectedModel,
        conversationHistory: currentConversation?.messages.map(m => ({ role: m.role, content: m.content })) || [],
        onToken: (token) => {
          setStreamingContent(prev => prev + token);
        },
        onComplete: (fullText, model) => {
          setStreamingContent('');
          setStreamingReasoning('');
          addMessage(fullText, 'assistant', currentMode, model, undefined, isThinkHarder);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          setStreamingContent('');
          addMessage(`❌ **Error:** ${error.message}`, 'assistant', currentMode, 'error');
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setStreamingContent('');
      addMessage('❌ An error occurred while processing your request.', 'assistant', currentMode, 'error');
      setIsLoading(false);
    }
  };

  const handleThinkHarder = () => {
    const lastUserMessage = currentConversation?.messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content, true);
    }
  };

  const handleWebSearch = async (query: string) => {
    setIsSearching(true);
    // Mock web search - integrate with real API later
    const searchPrompt = currentMode === 'research'
      ? `Search for latest papers, patents, and news on: ${query}. Provide a synthesis of the most recent findings.`
      : `Search the web for: ${query}. Provide relevant and up-to-date information.`;
    
    await handleSendMessage(searchPrompt);
    setIsSearching(false);
  };

  const handleModeChange = (newMode: ChatMode) => setMode(newMode);
  const handleNewChat = () => startNewChat();
  const handleToggleReasoning = () => updatePreferences({ showReasoning: !preferences.showReasoning });

  if (!isHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <BuckeyeLeafLogo size="lg" showText={false} />
          <p className="text-muted-foreground">Loading Furon AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar with projects, bookmarks, search */}
      <aside className={cn(
        'relative z-20 flex-shrink-0 border-r border-border bg-sidebar transition-all duration-300',
        sidebarOpen ? 'w-72' : 'w-0'
      )}>
        {sidebarOpen && (
          <ProjectsSidebar
            conversations={conversations}
            folders={folders}
            projects={projects}
            currentId={currentConversationId}
            currentMode={currentMode}
            onSelect={switchConversation}
            onDelete={deleteConversation}
            onNew={handleNewChat}
            onBookmark={toggleBookmark}
            onMoveToFolder={moveToFolder}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
            onRenameFolder={renameFolder}
            onCreateProject={createProject}
            onDeleteProject={deleteProject}
            onClearAll={clearAllConversations}
            apiKeys={apiKeys}
            onUpdateKey={updateApiKey}
            onClearKey={clearApiKey}
            temperature={preferences.temperature}
            maxTokens={preferences.maxTokens}
            wartimeMode={preferences.wartimeMode}
            onTemperatureChange={(v) => updatePreferences({ temperature: v })}
            onMaxTokensChange={(v) => updatePreferences({ maxTokens: v })}
            onWartimeModeChange={(v) => updatePreferences({ wartimeMode: v })}
            theme={preferences.theme}
            onToggleTheme={toggleTheme}
            customModels={customModels}
            onAddCustomModel={addCustomModel}
            onUpdateCustomModel={updateCustomModel}
            onDeleteCustomModel={deleteCustomModel}
            onReorderCustomModels={reorderCustomModels}
          />
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg hover:bg-secondary">
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
            <BuckeyeLeafLogo size="md" />
            <div className="hidden md:block">
              <ModeSelector currentMode={currentMode} onModeChange={handleModeChange} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ModelSelector selectedModelId={preferences.selectedModel} onModelChange={setSelectedModel} availableProviders={getAvailableProviders()} />
            </div>
            <ExportButton messages={currentConversation?.messages || []} conversationTitle={currentConversation?.title} />
          </div>
        </header>

        <div className="md:hidden px-4 py-2 border-b border-border flex items-center gap-2">
          <ModeSelector currentMode={currentMode} onModeChange={handleModeChange} />
          <ModelSelector selectedModelId={preferences.selectedModel} onModelChange={setSelectedModel} availableProviders={getAvailableProviders()} />
        </div>

        <main className="relative z-10 flex-1 overflow-hidden">
          <ChatContainer
            messages={currentConversation?.messages || []}
            mode={currentMode}
            isLoading={isLoading}
            streamingContent={streamingContent}
            streamingReasoning={streamingReasoning}
            showReasoning={preferences.showReasoning}
            onToggleReasoning={handleToggleReasoning}
            onSendMessage={handleSendMessage}
            onThinkHarder={handleThinkHarder}
            onWebSearch={handleWebSearch}
            isSearching={isSearching}
            conversationId={currentConversationId || undefined}
            onBranchChat={handleNewChat}
            allConversations={conversations}
          />
        </main>

        <footer className="relative z-10 px-4 py-2 border-t border-border bg-background">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                {getAvailableProviders().length > 0 ? (
                  <><span className="inline-block w-2 h-2 rounded-full bg-foreground/50 mr-1.5" />{getAvailableProviders().length} provider(s) connected</>
                ) : (
                  <><span className="inline-block w-2 h-2 rounded-full bg-destructive mr-1.5" />No API keys configured</>
                )}
              </span>
              <span className="hidden sm:inline text-muted-foreground/50">Furon AI can make mistakes. Check important info.</span>
            </div>
            <span className="text-muted-foreground/50">Furon AI</span>
          </div>
        </footer>
      </div>
    </div>
  );
}