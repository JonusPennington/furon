import { APIKeys, ChatMode, getModelById, getProviderByModelId, LLM_PROVIDERS, ProviderKey, ALL_MODELS } from '@/types/chat';
import { streamChat, ChatMessage, StreamCallbacks } from './api-clients';

// Detect query intent for smart routing
function detectQueryIntent(message: string): string[] {
  const intents: string[] = [];
  const lower = message.toLowerCase();

  // Math/Technical detection
  if (/\b(math|equation|calculate|derivative|integral|algebra|geometry|proof|theorem|formula)\b/.test(lower) ||
      /[\d+\-*/^=()]+/.test(message) && message.length > 10) {
    intents.push('math');
  }

  // Code detection
  if (/\b(code|function|class|api|debug|refactor|typescript|javascript|python|react|component)\b/.test(lower) ||
      /```|const |function |import |export /.test(message)) {
    intents.push('code');
  }

  // Research/citations detection
  if (/\b(research|study|paper|citation|source|evidence|according to|findings|data shows)\b/.test(lower) ||
      /\b(latest|recent|current|2024|2025)\b/.test(lower)) {
    intents.push('research');
  }

  // Multilingual detection
  if (/[\u4e00-\u9fff]/.test(message) || // Chinese
      /[\u3040-\u309f\u30a0-\u30ff]/.test(message) || // Japanese
      /[\uac00-\ud7af]/.test(message) || // Korean
      /[\u0600-\u06ff]/.test(message) || // Arabic
      /\b(translate|translation|multilingual|language)\b/.test(lower)) {
    intents.push('multilingual');
  }

  // Reasoning/complex detection
  if (/\b(explain|why|how does|reasoning|logic|analyze|compare|evaluate|pros and cons)\b/.test(lower)) {
    intents.push('reasoning');
  }

  // Agentic/task detection
  if (/\b(step by step|workflow|automate|agent|task|execute|run|schedule)\b/.test(lower)) {
    intents.push('agentic');
  }

  // Uncensored/controversial detection
  if (/\b(uncensored|controversial|opinion|debate|politics|religion)\b/.test(lower)) {
    intents.push('uncensored');
  }

  return intents.length > 0 ? intents : ['general'];
}

// Smart provider selection based on query intent
export function selectProviderSmart(
  message: string, 
  mode: ChatMode, 
  availableProviders: ProviderKey[]
): { provider: ProviderKey; modelId: string } | null {
  if (availableProviders.length === 0) return null;

  const intents = detectQueryIntent(message);
  
  // Priority routing based on intent
  const intentPriorities: Record<string, ProviderKey[]> = {
    math: ['deepseek', 'openai', 'anthropic', 'qwen'],
    code: ['anthropic', 'deepseek', 'mistral', 'openai'],
    research: ['perplexity', 'gemini', 'anthropic', 'openai'],
    multilingual: ['qwen', 'mistral', 'gemini', 'kimi'],
    reasoning: ['deepseek', 'anthropic', 'openai', 'mistral'],
    agentic: ['kimi', 'anthropic', 'openai', 'deepseek'],
    uncensored: ['gab', 'grok', 'openrouter'],
    general: ['openai', 'anthropic', 'gemini', 'grok'],
  };

  // Mode-based fallback priorities
  const modePriorities: Record<ChatMode, ProviderKey[]> = {
    innovation: ['grok', 'openai', 'anthropic', 'deepseek', 'gemini'],
    code: ['anthropic', 'deepseek', 'mistral', 'openai', 'gemini'],
    general: ['openai', 'anthropic', 'gemini', 'grok', 'qwen'],
    research: ['perplexity', 'gemini', 'anthropic', 'openai', 'deepseek'],
  };

  // Try intent-based routing first
  for (const intent of intents) {
    const priorities = intentPriorities[intent] || intentPriorities.general;
    for (const provider of priorities) {
      if (availableProviders.includes(provider)) {
        const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
        const modelId = providerConfig?.models[0]?.id || '';
        return { provider, modelId };
      }
    }
  }

  // Fall back to mode-based routing
  for (const provider of modePriorities[mode]) {
    if (availableProviders.includes(provider)) {
      const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
      const modelId = providerConfig?.models[0]?.id || '';
      return { provider, modelId };
    }
  }

  // Last resort: use first available
  const provider = availableProviders[0];
  const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
  return { provider, modelId: providerConfig?.models[0]?.id || '' };
}

// Legacy function for backward compatibility
export function selectProvider(mode: ChatMode, availableProviders: ProviderKey[]): ProviderKey | null {
  if (availableProviders.length === 0) return null;

  const priorities: Record<ChatMode, ProviderKey[]> = {
    innovation: ['grok', 'openai', 'anthropic', 'gemini', 'deepseek'],
    code: ['anthropic', 'deepseek', 'mistral', 'openai', 'gemini'],
    general: ['openai', 'anthropic', 'gemini', 'grok', 'qwen'],
    research: ['perplexity', 'gemini', 'anthropic', 'openai', 'deepseek'],
  };

  for (const provider of priorities[mode]) {
    if (availableProviders.includes(provider)) {
      return provider;
    }
  }

  return availableProviders[0];
}

// Get default model for a provider
export function getDefaultModelForProvider(provider: ProviderKey): string {
  const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
  return providerConfig?.models[0]?.id || '';
}

// Get system prompt based on mode
export function getSystemPrompt(mode: ChatMode): string {
  const modePrompts: Record<ChatMode, string> = {
    general: `You are Furon AI, an advanced AI assistant for Furon.co's R&D Innovation Lab. 
Your mission is to accelerate breakthrough discoveries across AI/ML, space exploration, biotech, sustainability, and quantum computing.
Be bold, think unconventionally, and push the boundaries of what's possible.

You are in General Conversation mode. Be helpful, informative, and engaging. 
Answer questions thoroughly while maintaining a futuristic, innovative perspective.`,

    innovation: `You are Furon AI, an urgent, truth-seeking innovation engine for Furon R&D Lab. Operate with wartime intensity. Always push for breakthroughs in AI/ML, space exploration, biotechnology, sustainable energy, quantum technologies, and cross-domain fusions. When the user describes an idea or problem:
- Generate 3-5 bold, novel variations
- Outline a minimal proof-of-concept roadmap (steps, timeline, key risks)
- Suggest patentable angles or prior art checks
- Critique for feasibility, scalability, and real-world impact
- End every response with 2-3 'what if' questions to spark deeper thinking.`,

    code: `You are Furon AI, an advanced AI assistant for Furon.co's R&D Innovation Lab. 
Your mission is to accelerate breakthrough discoveries across AI/ML, space exploration, biotech, sustainability, and quantum computing.
Be bold, think unconventionally, and push the boundaries of what's possible.

You are in Code/Prototype Building mode. Help build rapid prototypes and MVPs.
- Generate clean, modern code (prefer React, TypeScript, Next.js)
- Focus on functionality first, then polish
- Provide complete, runnable code snippets
- Suggest architecture decisions
- Help debug and optimize
- Think like a 10x engineer`,

    research: `You are Furon AI, an advanced AI assistant for Furon.co's R&D Innovation Lab. 
Your mission is to accelerate breakthrough discoveries across AI/ML, space exploration, biotech, sustainability, and quantum computing.
Be bold, think unconventionally, and push the boundaries of what's possible.

You are in Research Synthesis mode. Help analyze and synthesize research.
- Summarize complex papers and findings
- Identify key insights and implications
- Connect research across domains
- Highlight gaps and opportunities
- Suggest follow-up experiments
- Be rigorous but accessible`,
  };

  return modePrompts[mode];
}

// Generate mock response for fallback
function getMockResponse(mode: ChatMode, message: string): string {
  const mockResponses: Record<ChatMode, string> = {
    innovation: `**Breakthrough Analysis** (Mock Response - No API Key)

Based on your idea, here are some bold directions:

1. **Quantum-Enhanced Approach**: Leverage quantum computing principles for exponential speedup
2. **Bio-Inspired Solution**: Apply evolutionary algorithms and neural architectures
3. **Cross-Domain Fusion**: Combine techniques from aerospace and biotechnology

**POC Roadmap:**
- Week 1-2: Literature review and feasibility analysis
- Week 3-4: Minimal prototype development
- Week 5-6: Testing and iteration

**What if...**
- What if we could scale this 1000x?
- What if this technology existed 10 years from now?`,

    code: `**Prototype Response** (Mock Response - No API Key)

\`\`\`tsx
import { useState } from 'react';

export function Dashboard() {
  const [data, setData] = useState([]);

  return (
    <div className="p-6 bg-card rounded-xl">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Add your API key in Settings to generate real code.</p>
    </div>
  );
}
\`\`\`

Configure an API key to get fully functional code generation!`,

    research: `**Research Summary** (Mock Response - No API Key)

Key findings from recent literature:
- Emerging trends show convergence of AI and domain-specific applications
- Cross-disciplinary approaches yield breakthrough results
- Open challenges remain in scalability and reproducibility

Add your API key in Settings to get real research synthesis.`,

    general: `Hello! I'm Furon AI. (Mock Response - No API Key)

I can help you with:
• 💡 Innovation brainstorming
• ⚡ Code prototyping
• 🔬 Research synthesis
• 💬 General conversation

**To unlock my full potential**, please add an API key in Settings. We support:
- OpenAI, Anthropic, Google Gemini, xAI Grok
- DeepSeek, Qwen, Perplexity, Mistral
- Meta Llama, Moonshot Kimi, and more!`,
  };

  return mockResponses[mode];
}

export interface SendMessageOptions {
  message: string;
  mode: ChatMode;
  apiKeys: APIKeys;
  selectedModelId: string | null;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  onToken?: (token: string) => void;
  onComplete?: (fullText: string, model: string) => void;
  onError?: (error: Error) => void;
}

// Send message with streaming support
export async function sendMessage(options: SendMessageOptions): Promise<{ content: string; model: string }> {
  const {
    message,
    mode,
    apiKeys,
    selectedModelId,
    conversationHistory,
    onToken,
    onComplete,
    onError,
  } = options;

  // Determine which model to use
  let modelId = selectedModelId;
  let modelName = 'Mock';
  let provider: ProviderKey | null = null;
  let apiKey: string | undefined;

  if (modelId) {
    const model = getModelById(modelId);
    const providerConfig = getProviderByModelId(modelId);

    if (model && providerConfig) {
      apiKey = apiKeys[providerConfig.id];
      if (!apiKey) {
        // No API key for selected model - use mock
        const mockContent = getMockResponse(mode, message);
        onComplete?.(mockContent, 'mock');
        return { content: mockContent, model: 'mock' };
      }
      modelName = model.name;
      provider = providerConfig.id;
    }
  } else {
    // Smart auto-select based on message content, mode, and available keys
    const availableProviders = Object.entries(apiKeys)
      .filter(([_, value]) => !!value)
      .map(([key]) => key as ProviderKey);

    if (availableProviders.length === 0) {
      const mockContent = getMockResponse(mode, message);
      onComplete?.(mockContent, 'mock');
      return { content: mockContent, model: 'mock' };
    }

    const selection = selectProviderSmart(message, mode, availableProviders);
    if (selection) {
      provider = selection.provider;
      modelId = selection.modelId;
      apiKey = apiKeys[provider];
      const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
      modelName = providerConfig?.models.find(m => m.id === modelId)?.name || 'Unknown';
    }
  }

  if (!provider || !apiKey || !modelId) {
    const mockContent = getMockResponse(mode, message);
    onComplete?.(mockContent, 'mock');
    return { content: mockContent, model: 'mock' };
  }

  // Build messages array with system prompt
  const systemPrompt = getSystemPrompt(mode);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  // Stream the response
  return new Promise((resolve) => {
    let fullContent = '';

    const callbacks: StreamCallbacks = {
      onToken: (token) => {
        fullContent += token;
        onToken?.(token);
      },
      onComplete: (text) => {
        onComplete?.(text, modelName);
        resolve({ content: text, model: modelName });
      },
      onError: (error) => {
        onError?.(error);
        const errorContent = `**Error from ${modelName}:** ${error.message}`;
        resolve({ content: errorContent, model: modelName });
      },
    };

    streamChat(provider!, apiKey!, modelId!, messages, callbacks);
  });
}
