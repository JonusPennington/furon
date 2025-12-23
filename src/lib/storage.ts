/**
 * Storage abstraction layer - designed for easy backend migration
 * Currently uses localStorage with encryption, can be swapped to Supabase later
 */

import { Conversation, APIKeys, Folder, Project, CustomModel } from '@/types/chat';
import { encryptData, decryptData } from './encryption';

const STORAGE_KEYS = {
  CONVERSATIONS: 'furon-conversations',
  API_KEYS: 'furon-api-keys-v2',
  PREFERENCES: 'furon-preferences',
  SELECTED_MODEL: 'furon-selected-model',
  FOLDERS: 'furon-folders',
  PROJECTS: 'furon-projects',
  MEMORY: 'furon-memory',
  CUSTOM_MODELS: 'furon-custom-models',
} as const;

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultMode: 'general' | 'innovation' | 'code' | 'research';
  selectedModel: string | null;
  temperature: number;
  maxTokens: number;
  wartimeMode: boolean;
  showReasoning: boolean;
}

export interface ConversationMemory {
  keyDetails: string[];
  projects: string[];
  priorities: string[];
  lastUpdated: Date;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  defaultMode: 'general',
  selectedModel: null,
  temperature: 0.7,
  maxTokens: 4096,
  wartimeMode: false,
  showReasoning: false,
};

const DEFAULT_MEMORY: ConversationMemory = {
  keyDetails: [],
  projects: [],
  priorities: [],
  lastUpdated: new Date(),
};

// Storage interface - implement this for different backends
export interface StorageProvider {
  // Conversations
  getConversations(): Promise<Conversation[]>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  
  // API Keys (encrypted)
  getAPIKeys(): Promise<APIKeys>;
  saveAPIKeys(keys: APIKeys): Promise<void>;
  
  // Preferences
  getPreferences(): Promise<UserPreferences>;
  savePreferences(prefs: UserPreferences): Promise<void>;
  
  // Folders
  getFolders(): Promise<Folder[]>;
  saveFolder(folder: Folder): Promise<void>;
  deleteFolder(id: string): Promise<void>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  
  // Memory
  getMemory(): Promise<ConversationMemory>;
  saveMemory(memory: ConversationMemory): Promise<void>;
  
  // Custom Models
  getCustomModels(): Promise<CustomModel[]>;
  saveCustomModel(model: CustomModel): Promise<void>;
  saveCustomModels(models: CustomModel[]): Promise<void>;
  deleteCustomModel(id: string): Promise<void>;
}

// LocalStorage implementation with encryption for sensitive data
class LocalStorageProvider implements StorageProvider {
  private parse<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      return JSON.parse(stored);
    } catch {
      console.error(`Failed to parse ${key} from localStorage`);
      return defaultValue;
    }
  }

  private save(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage`, error);
    }
  }

  async getConversations(): Promise<Conversation[]> {
    const conversations = this.parse<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    // Rehydrate dates
    return conversations.map(conv => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const conversations = await this.getConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    
    // Keep only last 50 conversations
    const trimmed = conversations.slice(0, 50);
    this.save(STORAGE_KEYS.CONVERSATIONS, trimmed);
  }

  async deleteConversation(id: string): Promise<void> {
    const conversations = await this.getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    this.save(STORAGE_KEYS.CONVERSATIONS, filtered);
  }

  async getAPIKeys(): Promise<APIKeys> {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      if (!encrypted) return {};
      
      const decrypted = await decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt API keys:', error);
      return {};
    }
  }

  async saveAPIKeys(keys: APIKeys): Promise<void> {
    try {
      const encrypted = await encryptData(JSON.stringify(keys));
      localStorage.setItem(STORAGE_KEYS.API_KEYS, encrypted);
    } catch (error) {
      console.error('Failed to encrypt API keys:', error);
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    return this.parse<UserPreferences>(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    this.save(STORAGE_KEYS.PREFERENCES, prefs);
  }

  async getFolders(): Promise<Folder[]> {
    const folders = this.parse<Folder[]>(STORAGE_KEYS.FOLDERS, []);
    return folders.map(f => ({
      ...f,
      createdAt: new Date(f.createdAt),
    }));
  }

  async saveFolder(folder: Folder): Promise<void> {
    const folders = await this.getFolders();
    const index = folders.findIndex(f => f.id === folder.id);
    if (index >= 0) {
      folders[index] = folder;
    } else {
      folders.push(folder);
    }
    this.save(STORAGE_KEYS.FOLDERS, folders);
  }

  async deleteFolder(id: string): Promise<void> {
    const folders = await this.getFolders();
    this.save(STORAGE_KEYS.FOLDERS, folders.filter(f => f.id !== id));
  }

  async getProjects(): Promise<Project[]> {
    const projects = this.parse<Project[]>(STORAGE_KEYS.PROJECTS, []);
    return projects.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  }

  async saveProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    this.save(STORAGE_KEYS.PROJECTS, projects);
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects();
    this.save(STORAGE_KEYS.PROJECTS, projects.filter(p => p.id !== id));
  }

  async getMemory(): Promise<ConversationMemory> {
    const memory = this.parse<ConversationMemory>(STORAGE_KEYS.MEMORY, DEFAULT_MEMORY);
    return {
      ...memory,
      lastUpdated: new Date(memory.lastUpdated),
    };
  }

  async saveMemory(memory: ConversationMemory): Promise<void> {
    this.save(STORAGE_KEYS.MEMORY, memory);
  }

  async getCustomModels(): Promise<CustomModel[]> {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.CUSTOM_MODELS);
      if (!encrypted) return [];
      
      const decrypted = await decryptData(encrypted);
      const models = JSON.parse(decrypted);
      return models.map((m: CustomModel) => ({
        ...m,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to decrypt custom models:', error);
      return [];
    }
  }

  async saveCustomModel(model: CustomModel): Promise<void> {
    const models = await this.getCustomModels();
    const index = models.findIndex(m => m.id === model.id);
    if (index >= 0) {
      models[index] = model;
    } else {
      models.push(model);
    }
    await this.saveCustomModels(models);
  }

  async saveCustomModels(models: CustomModel[]): Promise<void> {
    try {
      const encrypted = await encryptData(JSON.stringify(models));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MODELS, encrypted);
    } catch (error) {
      console.error('Failed to encrypt custom models:', error);
    }
  }

  async deleteCustomModel(id: string): Promise<void> {
    const models = await this.getCustomModels();
    await this.saveCustomModels(models.filter(m => m.id !== id));
  }
}

// Export singleton instance - swap this for Supabase later
export const storage: StorageProvider = new LocalStorageProvider();
