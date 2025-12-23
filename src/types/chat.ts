export type ChatMode = 'general' | 'innovation' | 'code' | 'research';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ChatMode;
  model?: string;
  timestamp: Date;
  reasoning?: string; // Chain-of-thought reasoning steps
  isThinkHarder?: boolean; // If this was a "think harder" request
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  mode: ChatMode;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string; // For folder organization
  isBookmarked?: boolean; // Bookmark status
}

export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
}

export type ApiFormat = 'openai' | 'anthropic' | 'gemini';

export interface CustomModel {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  apiFormat: ApiFormat;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  conversationIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProviderKey = 
  | 'grok' 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'deepseek' 
  | 'qwen' 
  | 'perplexity' 
  | 'gab' 
  | 'kimi' 
  | 'openrouter'
  | 'meta'
  | 'mistral';

export interface APIKeys {
  grok?: string;
  openai?: string;
  anthropic?: string;
  gemini?: string;
  deepseek?: string;
  qwen?: string;
  perplexity?: string;
  gab?: string;
  kimi?: string;
  openrouter?: string;
  meta?: string;
  mistral?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderKey;
  description: string;
  tags?: string[]; // For routing: 'math', 'multilingual', 'research', 'uncensored', 'agentic'
}

export interface LLMProvider {
  id: ProviderKey;
  name: string;
  description: string;
  strengths: string[];
  color: string;
  models: ModelOption[];
  baseUrl?: string; // For OpenAI-compatible APIs
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'grok',
    name: 'Grok (xAI)',
    description: 'Rebellious, innovative thinking',
    strengths: ['Innovation', 'Unconventional ideas', 'Breaking paradigms'],
    color: 'neon-pink',
    models: [
      { id: 'grok-2', name: 'Grok-2', provider: 'grok', description: 'Latest and most capable', tags: ['uncensored', 'creative'] },
      { id: 'grok-2-mini', name: 'Grok-2 Mini', provider: 'grok', description: 'Faster, lighter version', tags: ['uncensored'] },
    ],
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    description: 'Structured, thoughtful analysis',
    strengths: ['Code generation', 'Planning', 'Safety-conscious'],
    color: 'neon-purple',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', description: 'Best balance of speed and capability', tags: ['code', 'reasoning'] },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Previous generation, still excellent', tags: ['code'] },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most capable, slower', tags: ['reasoning'] },
    ],
  },
  {
    id: 'openai',
    name: 'GPT (OpenAI)',
    description: 'Creative, broad capabilities',
    strengths: ['Creativity', 'General knowledge', 'Versatility'],
    color: 'neon-green',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Flagship multimodal model', tags: ['general', 'creative'] },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Fast and cost-effective', tags: ['general'] },
      { id: 'o1-preview', name: 'o1 Preview', provider: 'openai', description: 'Advanced reasoning model', tags: ['math', 'reasoning'] },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    description: 'Multimodal, research-focused',
    strengths: ['Research', 'Data analysis', 'Multimodal'],
    color: 'neon-cyan',
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', description: 'Most capable, long context', tags: ['research', 'multimodal'] },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', description: 'Fast and efficient', tags: ['general'] },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'gemini', description: 'Next-gen experimental', tags: ['research'] },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Cost-effective reasoning powerhouse',
    strengths: ['Math', 'Technical', 'Code', 'Cost-effective'],
    color: 'neon-blue',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'deepseek', description: 'Cost-Effective Reasoning', tags: ['math', 'reasoning', 'code'] },
      { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'deepseek', description: 'Fast general chat', tags: ['general', 'code'] },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    description: 'Multilingual powerhouse',
    strengths: ['Multilingual', 'Long context', 'Coding'],
    color: 'neon-orange',
    models: [
      { id: 'qwen-max', name: 'Qwen3 Max', provider: 'qwen', description: 'Multilingual Power', tags: ['multilingual', 'reasoning'] },
      { id: 'qwen-plus', name: 'Qwen3 Plus', provider: 'qwen', description: 'Balanced performance', tags: ['multilingual', 'general'] },
      { id: 'qwen-turbo', name: 'Qwen3 Turbo', provider: 'qwen', description: 'Fast and efficient', tags: ['multilingual'] },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'AI-powered research with citations',
    strengths: ['Research', 'Web search', 'Citations', 'Real-time data'],
    color: 'neon-teal',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', provider: 'perplexity', description: 'Research Mode with Citations', tags: ['research', 'citations'] },
      { id: 'sonar', name: 'Sonar', provider: 'perplexity', description: 'Fast web-grounded answers', tags: ['research'] },
      { id: 'sonar-reasoning', name: 'Sonar Reasoning', provider: 'perplexity', description: 'Chain-of-thought with search', tags: ['research', 'reasoning'] },
    ],
  },
  {
    id: 'gab',
    name: 'Gab AI',
    description: 'Uncensored, bold responses',
    strengths: ['Uncensored', 'Free speech', 'Direct answers'],
    color: 'neon-red',
    models: [
      { id: 'gab-ai', name: 'Gab AI', provider: 'gab', description: 'Uncensored Bold Responses', tags: ['uncensored'] },
    ],
  },
  {
    id: 'kimi',
    name: 'Moonshot Kimi',
    description: 'Agentic AI with tool use',
    strengths: ['Agentic', 'Tool use', 'Long context', 'Chinese'],
    color: 'neon-violet',
    models: [
      { id: 'moonshot-v1-128k', name: 'Kimi 128K', provider: 'kimi', description: 'Agentic Long Context', tags: ['agentic', 'multilingual'] },
      { id: 'moonshot-v1-32k', name: 'Kimi 32K', provider: 'kimi', description: 'Balanced context window', tags: ['agentic'] },
      { id: 'moonshot-v1-8k', name: 'Kimi 8K', provider: 'kimi', description: 'Fast responses', tags: ['agentic'] },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified access to 100+ models',
    strengths: ['Model variety', 'Fallback routing', 'Cost optimization'],
    color: 'neon-gold',
    models: [
      { id: 'openrouter/auto', name: 'Auto Router', provider: 'openrouter', description: 'Best model for your query', tags: ['general'] },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 (OR)', provider: 'openrouter', description: 'Via OpenRouter', tags: ['code', 'reasoning'] },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro (OR)', provider: 'openrouter', description: 'Via OpenRouter', tags: ['research'] },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OR)', provider: 'openrouter', description: 'Via OpenRouter', tags: ['math', 'reasoning'] },
    ],
  },
  {
    id: 'meta',
    name: 'Meta Llama',
    description: 'Open-weight powerhouse',
    strengths: ['Open source', 'Customizable', 'Coding'],
    color: 'neon-indigo',
    models: [
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'meta', description: 'Most capable open model', tags: ['code', 'general'] },
      { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'meta', description: 'Largest Llama model', tags: ['reasoning', 'code'] },
      { id: 'llama-3.2-90b-vision', name: 'Llama 3.2 Vision', provider: 'meta', description: 'Multimodal capabilities', tags: ['multimodal'] },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'European AI excellence',
    strengths: ['Efficiency', 'Multilingual', 'Code'],
    color: 'neon-amber',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large 3', provider: 'mistral', description: 'Flagship model', tags: ['reasoning', 'multilingual'] },
      { id: 'mistral-small-latest', name: 'Mistral Small 3', provider: 'mistral', description: 'Fast and efficient', tags: ['general', 'code'] },
      { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', description: 'Optimized for code', tags: ['code'] },
    ],
  },
];

// Get all available models as a flat list
export const ALL_MODELS: ModelOption[] = LLM_PROVIDERS.flatMap(p => p.models);

// Get model by ID
export const getModelById = (id: string): ModelOption | undefined => 
  ALL_MODELS.find(m => m.id === id);

// Get provider by model ID
export const getProviderByModelId = (modelId: string): LLMProvider | undefined => {
  const model = getModelById(modelId);
  return model ? LLM_PROVIDERS.find(p => p.id === model.provider) : undefined;
};

// Get provider config by ID
export const getProviderById = (providerId: ProviderKey): LLMProvider | undefined =>
  LLM_PROVIDERS.find(p => p.id === providerId);

export const CHAT_MODES: { 
  id: ChatMode; 
  label: string; 
  icon: string; 
  description: string;
  color?: string;
  bgClass?: string;
}[] = [
  {
    id: 'general',
    label: 'General',
    icon: '💬',
    description: 'Open conversation and Q&A',
  },
  {
    id: 'innovation',
    label: 'Innovation',
    icon: '🔥',
    description: 'Wartime intensity brainstorming',
    color: 'innovation',
    bgClass: 'bg-gradient-to-r from-orange-500 to-red-500',
  },
  {
    id: 'code',
    label: 'Prototype',
    icon: '⚡',
    description: 'Build apps with live code preview',
    color: 'code',
    bgClass: 'bg-gradient-to-r from-emerald-500 to-cyan-500',
  },
  {
    id: 'research',
    label: 'Research',
    icon: '🔬',
    description: 'Synthesize and analyze research',
  },
];

export const INNOVATION_TOOLS = [
  {
    id: 'generate-poc',
    label: 'Generate POC Idea',
    icon: '🚀',
    prompt: 'Generate a proof-of-concept idea that combines cutting-edge technologies from different domains. Focus on AI/ML, space exploration, biotech, sustainability, or quantum computing. Be bold and unconventional.',
  },
  {
    id: 'critique',
    label: 'Critique Invention',
    icon: '🔍',
    prompt: 'Critically analyze this invention or idea. Identify potential flaws, improvements, and alternative approaches. Be thorough but constructive.',
  },
  {
    id: 'cross-pollinate',
    label: 'Cross-Pollinate',
    icon: '🧬',
    prompt: 'Take concepts from completely different domains and combine them in unexpected ways. Look for patterns and principles that could transfer between fields.',
  },
];
