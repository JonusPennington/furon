import { useState } from 'react';
import { Conversation, Folder, Project, APIKeys, ProviderKey, ChatMode, CHAT_MODES, CustomModel } from '@/types/chat';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, Trash2, Plus, FolderPlus, Bookmark, 
  ChevronRight, ChevronDown, MoreHorizontal, Edit2, 
  FolderOpen, Star, Search as SearchIcon, Flame, Code2, FlaskConical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsPanel } from '@/components/SettingsPanel';

interface ProjectsSidebarProps {
  conversations: Conversation[];
  folders: Folder[];
  projects: Project[];
  currentId: string | null;
  currentMode: ChatMode;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onBookmark: (id: string) => void;
  onMoveToFolder: (convId: string, folderId: string | undefined) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onCreateProject: (name: string, description?: string) => void;
  onDeleteProject: (id: string) => void;
  onClearAll: () => void;
  // Settings props
  apiKeys: APIKeys;
  onUpdateKey: (provider: ProviderKey, key: string) => void;
  onClearKey: (provider: ProviderKey) => void;
  temperature: number;
  maxTokens: number;
  wartimeMode: boolean;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onWartimeModeChange: (value: boolean) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  // Custom models props
  customModels?: CustomModel[];
  onAddCustomModel?: (model: Omit<CustomModel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomModel>;
  onUpdateCustomModel?: (id: string, updates: Partial<Omit<CustomModel, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteCustomModel?: (id: string) => Promise<void>;
  onReorderCustomModels?: (models: CustomModel[]) => Promise<void>;
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

export function ProjectsSidebar({ 
  conversations, 
  folders,
  projects,
  currentId, 
  currentMode,
  onSelect, 
  onDelete, 
  onNew,
  onBookmark,
  onMoveToFolder,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onCreateProject,
  onDeleteProject,
  onClearAll,
  apiKeys,
  onUpdateKey,
  onClearKey,
  temperature,
  maxTokens,
  wartimeMode,
  onTemperatureChange,
  onMaxTokensChange,
  onWartimeModeChange,
  theme,
  onToggleTheme,
  customModels,
  onAddCustomModel,
  onUpdateCustomModel,
  onDeleteCustomModel,
  onReorderCustomModels,
}: ProjectsSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedModes, setExpandedModes] = useState<Set<ChatMode>>(new Set([currentMode]));
  const [newFolderName, setNewFolderName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'bookmarks' | 'projects'>('chats');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMode = (mode: ChatMode) => {
    setExpandedModes(prev => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
      setNewProjectName('');
      setNewProjectDesc('');
    }
  };

  const handleRenameFolder = (id: string) => {
    if (editFolderName.trim()) {
      onRenameFolder(id, editFolderName.trim());
      setEditingFolder(null);
      setEditFolderName('');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by mode
  const conversationsByMode = CHAT_MODES.reduce((acc, mode) => {
    acc[mode.id] = filteredConversations.filter(c => c.mode === mode.id);
    return acc;
  }, {} as Record<ChatMode, Conversation[]>);

  const bookmarkedConversations = filteredConversations.filter(c => c.isBookmarked);

  const ConversationItem = ({ conv }: { conv: Conversation }) => (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all overflow-hidden',
        currentId === conv.id
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-secondary/50'
      )}
      onClick={() => onSelect(conv.id)}
    >
      <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-foreground truncate" style={{ maxWidth: '120px' }}>
        {conv.title}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark(conv.id);
          }}
          className={cn(
            'p-1 rounded transition-colors',
            conv.isBookmarked 
              ? 'text-yellow-500' 
              : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          <Star className={cn('w-3.5 h-3.5', conv.isBookmarked && 'fill-current')} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conv.id);
          }}
          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const ModeSection = ({ mode }: { mode: ChatMode }) => {
    const modeConvs = conversationsByMode[mode];
    const isExpanded = expandedModes.has(mode);
    const isCurrentMode = mode === currentMode;

    if (modeConvs.length === 0 && !isCurrentMode) return null;

    return (
      <div className="space-y-1">
        <div 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group",
            isCurrentMode ? "bg-secondary/70" : "hover:bg-secondary/50"
          )}
          onClick={() => toggleMode(mode)}
        >
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="shrink-0">{modeIcons[mode]}</div>
          <span className={cn(
            "text-sm font-medium flex-1 min-w-0 truncate",
            isCurrentMode && "text-primary"
          )}>
            {modeLabels[mode]}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {modeConvs.length}
          </span>
        </div>
        {isExpanded && (
          <div className="pl-3 pr-3 space-y-1">
            {modeConvs.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">No conversations yet</p>
            ) : (
              modeConvs.map(conv => (
                <ConversationItem key={conv.id} conv={conv} />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/50 space-y-3">
        <Button 
          onClick={onNew}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 grid grid-cols-3">
          <TabsTrigger value="chats" className="text-xs">Chats</TabsTrigger>
          <TabsTrigger value="bookmarks" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="chats" className="px-3 py-2 space-y-2 mt-0">
            {/* Mode Sections */}
            {CHAT_MODES.map(mode => (
              <ModeSection key={mode.id} mode={mode.id} />
            ))}

            {/* Folders */}
            {folders.length > 0 && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <p className="text-xs text-muted-foreground px-3 py-1">Folders</p>
                {folders.map(folder => {
                  const folderConvs = filteredConversations.filter(c => c.folderId === folder.id);
                  return (
                    <div key={folder.id} className="space-y-1">
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer group"
                        onClick={() => toggleFolder(folder.id)}
                      >
                        {expandedFolders.has(folder.id) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        {editingFolder === folder.id ? (
                          <Input
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            onBlur={() => handleRenameFolder(folder.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 text-sm flex-1 min-w-0"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium flex-1 min-w-0 truncate">{folder.name}</span>
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {folderConvs.length}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary shrink-0"
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setEditingFolder(folder.id);
                              setEditFolderName(folder.name);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteFolder(folder.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {expandedFolders.has(folder.id) && (
                        <div className="pl-3 pr-3 space-y-1">
                          {folderConvs.map(conv => (
                            <ConversationItem key={conv.id} conv={conv} />
                          ))}
                          {folderConvs.length === 0 && (
                            <p className="text-xs text-muted-foreground px-3 py-2">Empty folder</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Folder */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-secondary/50 text-muted-foreground text-sm">
                  <FolderPlus className="w-4 h-4 shrink-0" />
                  New Folder
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button onClick={handleCreateFolder} className="w-full">
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="bookmarks" className="px-3 py-2 space-y-1 mt-0">
            {bookmarkedConversations.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No bookmarked chats</p>
                <p className="text-xs text-muted-foreground/70">Click the star on any chat to save it</p>
              </div>
            ) : (
              bookmarkedConversations.map(conv => (
                <ConversationItem key={conv.id} conv={conv} />
              ))
            )}
          </TabsContent>

          <TabsContent value="projects" className="px-3 py-2 space-y-2 mt-0">
            {/* Create Project */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                  <Button onClick={handleCreateProject} className="w-full">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground/70">Create a project to organize related chats</p>
              </div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{project.name}</span>
                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground">{project.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70">
                    {project.conversationIds.length} conversations
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer with Settings and Clear All */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <SettingsPanel
          apiKeys={apiKeys}
          onUpdateKey={onUpdateKey}
          onClearKey={onClearKey}
          temperature={temperature}
          maxTokens={maxTokens}
          wartimeMode={wartimeMode}
          onTemperatureChange={onTemperatureChange}
          onMaxTokensChange={onMaxTokensChange}
          onWartimeModeChange={onWartimeModeChange}
          theme={theme}
          onToggleTheme={onToggleTheme}
          variant="sidebar"
          customModels={customModels}
          onAddCustomModel={onAddCustomModel}
          onUpdateCustomModel={onUpdateCustomModel}
          onDeleteCustomModel={onDeleteCustomModel}
          onReorderCustomModels={onReorderCustomModels}
        />
        {conversations.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Clear all chats
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all chats?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {conversations.length} conversation(s). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
