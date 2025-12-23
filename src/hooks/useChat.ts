import { useState, useCallback, useEffect } from 'react';
import { Message, ChatMode, Conversation, Folder, Project } from '@/types/chat';
import { storage, ConversationMemory } from '@/lib/storage';

// Generate a smart, concise title from user message
function generateSmartTitle(content: string): string {
  // Remove common filler words and clean up
  const cleaned = content
    .replace(/^(can you|could you|please|help me|i want to|i need to|how do i|what is|explain)\s*/gi, '')
    .replace(/[?!.,]+$/g, '')
    .trim();
  
  // Extract key phrases - prioritize nouns and technical terms
  const words = cleaned.split(/\s+/);
  
  // If short enough, use as is
  if (cleaned.length <= 35) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  // Otherwise, take first meaningful words up to ~35 chars
  let title = '';
  for (const word of words) {
    if ((title + ' ' + word).trim().length <= 35) {
      title = (title + ' ' + word).trim();
    } else {
      break;
    }
  }
  
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [memory, setMemory] = useState<ConversationMemory | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<ChatMode>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load data on mount
  useEffect(() => {
    Promise.all([
      storage.getConversations(),
      storage.getFolders(),
      storage.getProjects(),
      storage.getMemory(),
    ]).then(([savedConvs, savedFolders, savedProjects, savedMemory]) => {
      const withMessages = savedConvs.filter(c => c.messages.length > 0);
      setConversations(withMessages);
      setFolders(savedFolders);
      setProjects(savedProjects);
      setMemory(savedMemory);
      setIsHydrated(true);
    });
  }, []);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const displayConversations = conversations.filter(c => c.messages.length > 0);
  
  // Get conversations for current mode only
  const modeConversations = displayConversations.filter(c => c.mode === currentMode);

  const createConversation = useCallback((mode: ChatMode = 'general') => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      mode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setCurrentMode(mode);
    
    return newConversation;
  }, []);

  const ensureConversation = useCallback((mode: ChatMode) => {
    if (currentConversation && currentConversation.messages.length === 0 && currentConversation.mode === mode) {
      return currentConversation;
    }
    return createConversation(mode);
  }, [currentConversation, createConversation]);

  // When mode changes, switch to a fresh chat for that mode
  const setMode = useCallback((mode: ChatMode) => {
    if (mode === currentMode) return;
    
    setCurrentMode(mode);
    // Clear current conversation when switching modes - start fresh
    setCurrentConversationId(null);
    // Remove any empty conversations from the previous mode
    setConversations(prev => prev.filter(c => c.messages.length > 0));
  }, [currentMode]);

  const addMessage = useCallback((
    content: string, 
    role: 'user' | 'assistant', 
    mode: ChatMode, 
    model?: string,
    reasoning?: string,
    isThinkHarder?: boolean
  ) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      mode,
      timestamp: new Date(),
      model,
      reasoning,
      isThinkHarder,
    };

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === currentConversationId) {
          const updatedMessages = [...conv.messages, message];
          
          // Generate smart title from first user message
          let title = conv.title;
          if (conv.messages.length === 0 && role === 'user') {
            title = generateSmartTitle(content);
          }
          
          const updatedConv = {
            ...conv,
            messages: updatedMessages,
            title,
            mode,
            updatedAt: new Date(),
          };
          
          storage.saveConversation(updatedConv);
          return updatedConv;
        }
        return conv;
      });
      return updated;
    });

    return message;
  }, [currentConversationId]);

  const deleteConversation = useCallback(async (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    await storage.deleteConversation(id);
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId]);

  const switchConversation = useCallback((id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setCurrentMode(conv.mode);
    }
  }, [conversations]);

  const clearCurrentConversation = useCallback(() => {
    setConversations(prev => prev.filter(c => c.messages.length > 0 || c.id !== currentConversationId));
    setCurrentConversationId(null);
  }, [currentConversationId]);

  const startNewChat = useCallback(() => {
    setConversations(prev => prev.filter(c => c.messages.length > 0));
    setCurrentConversationId(null);
    return createConversation(currentMode);
  }, [createConversation, currentMode]);

  const clearAllConversations = useCallback(async () => {
    for (const conv of conversations) {
      await storage.deleteConversation(conv.id);
    }
    setConversations([]);
    setCurrentConversationId(null);
  }, [conversations]);

  // Bookmark functionality
  const toggleBookmark = useCallback(async (id: string) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === id) {
          const updatedConv = { ...conv, isBookmarked: !conv.isBookmarked };
          storage.saveConversation(updatedConv);
          return updatedConv;
        }
        return conv;
      });
      return updated;
    });
  }, []);

  // Folder functionality
  const moveToFolder = useCallback(async (convId: string, folderId: string | undefined) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === convId) {
          const updatedConv = { ...conv, folderId };
          storage.saveConversation(updatedConv);
          return updatedConv;
        }
        return conv;
      });
      return updated;
    });
  }, []);

  const createFolder = useCallback(async (name: string) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
    };
    setFolders(prev => [...prev, newFolder]);
    await storage.saveFolder(newFolder);
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    // Remove folder reference from conversations
    setConversations(prev => 
      prev.map(conv => 
        conv.folderId === id ? { ...conv, folderId: undefined } : conv
      )
    );
    setFolders(prev => prev.filter(f => f.id !== id));
    await storage.deleteFolder(id);
  }, []);

  const renameFolder = useCallback(async (id: string, name: string) => {
    setFolders(prev => {
      const updated = prev.map(f => 
        f.id === id ? { ...f, name } : f
      );
      const folder = updated.find(f => f.id === id);
      if (folder) storage.saveFolder(folder);
      return updated;
    });
  }, []);

  // Project functionality
  const createProject = useCallback(async (name: string, description?: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      conversationIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => [...prev, newProject]);
    await storage.saveProject(newProject);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await storage.deleteProject(id);
  }, []);

  // Memory functionality
  const updateMemory = useCallback(async (updates: Partial<ConversationMemory>) => {
    const updated = {
      ...memory,
      ...updates,
      lastUpdated: new Date(),
    } as ConversationMemory;
    setMemory(updated);
    await storage.saveMemory(updated);
  }, [memory]);

  return {
    conversations: displayConversations,
    modeConversations,
    folders,
    projects,
    memory,
    currentConversation,
    currentConversationId,
    currentMode,
    isLoading,
    isHydrated,
    setIsLoading,
    setMode,
    createConversation,
    ensureConversation,
    addMessage,
    deleteConversation,
    switchConversation,
    clearCurrentConversation,
    clearAllConversations,
    startNewChat,
    toggleBookmark,
    moveToFolder,
    createFolder,
    deleteFolder,
    renameFolder,
    createProject,
    deleteProject,
    updateMemory,
  };
}
