import { ProviderKey, getProviderById, CustomModel, ApiFormat } from '@/types/chat';

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// OpenAI-compatible streaming (works for OpenAI, xAI/Grok, DeepSeek, Qwen, Kimi, OpenRouter, Mistral)
async function streamOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  extraHeaders?: Record<string, string>
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status})`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
    } catch {
      if (response.status === 401) errorMessage = 'Invalid API key';
      else if (response.status === 429) errorMessage = 'Rate limit exceeded. Please wait and try again.';
      else if (response.status === 403) errorMessage = 'Access forbidden. Check your API key permissions.';
    }
    
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          callbacks.onToken(content);
        }
      } catch {
        // Ignore parse errors for incomplete chunks
      }
    }
  }

  callbacks.onComplete(fullText);
}

// Anthropic streaming
async function streamAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage?.content || '',
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status})`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      if (response.status === 401) errorMessage = 'Invalid API key';
      else if (response.status === 429) errorMessage = 'Rate limit exceeded. Please wait and try again.';
      else if (response.status === 403) errorMessage = 'Access forbidden. Check your API key permissions.';
    }
    
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text;
          callbacks.onToken(parsed.delta.text);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  callbacks.onComplete(fullText);
}

// Google Gemini streaming
async function streamGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status})`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      if (response.status === 400) errorMessage = 'Invalid request. Check your API key.';
      else if (response.status === 403) errorMessage = 'Access forbidden. Check your API key.';
      else if (response.status === 429) errorMessage = 'Rate limit exceeded. Please wait and try again.';
    }
    
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);

      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          fullText += text;
          callbacks.onToken(text);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  callbacks.onComplete(fullText);
}

// Perplexity streaming (OpenAI-compatible with citations)
async function streamPerplexity(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  await streamOpenAICompatible(
    'https://api.perplexity.ai/chat/completions',
    apiKey,
    model,
    messages,
    callbacks
  );
}

// Gab AI streaming (custom API)
async function streamGabAI(
  apiKey: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  // Gab AI uses a simple REST API
  const response = await fetch('https://api.gab.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gab AI Error: ${errorText}`);
  }

  // Handle as OpenAI-compatible stream
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || parsed.content;
        if (content) {
          fullText += content;
          callbacks.onToken(content);
        }
      } catch {
        // Handle non-JSON responses
        if (data && !data.startsWith('{')) {
          fullText += data;
          callbacks.onToken(data);
        }
      }
    }
  }

  callbacks.onComplete(fullText);
}

// Provider endpoint mapping
const PROVIDER_ENDPOINTS: Partial<Record<ProviderKey, string>> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  grok: 'https://api.x.ai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  kimi: 'https://api.moonshot.cn/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  meta: 'https://openrouter.ai/api/v1/chat/completions', // Meta Llama via OpenRouter
};

// Main streaming function
export async function streamChat(
  provider: ProviderKey,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    switch (provider) {
      case 'openai':
      case 'grok':
      case 'deepseek':
      case 'qwen':
      case 'kimi':
      case 'mistral':
        await streamOpenAICompatible(
          PROVIDER_ENDPOINTS[provider]!,
          apiKey,
          model,
          messages,
          callbacks
        );
        break;

      case 'openrouter':
      case 'meta':
        // OpenRouter and Meta Llama use OpenRouter API
        await streamOpenAICompatible(
          PROVIDER_ENDPOINTS.openrouter!,
          apiKey,
          provider === 'meta' ? `meta-llama/${model}` : model,
          messages,
          callbacks,
          { 'HTTP-Referer': window.location.origin }
        );
        break;

      case 'anthropic':
        await streamAnthropic(apiKey, model, messages, callbacks);
        break;

      case 'gemini':
        await streamGemini(apiKey, model, messages, callbacks);
        break;

      case 'perplexity':
        await streamPerplexity(apiKey, model, messages, callbacks);
        break;

      case 'gab':
        await streamGabAI(apiKey, messages, callbacks);
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

// Stream from a custom model based on its API format
export async function streamCustomModel(
  customModel: CustomModel,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const { apiFormat, apiKey, modelId, baseUrl } = customModel;

    switch (apiFormat) {
      case 'anthropic':
        // For Anthropic format, we call the Anthropic streaming function
        // but the baseUrl might be custom, so we need to handle that
        await streamAnthropicCustom(baseUrl, apiKey, modelId, messages, callbacks);
        break;

      case 'gemini':
        // For Gemini format, we call the Gemini streaming function with custom base URL
        await streamGeminiCustom(baseUrl, apiKey, modelId, messages, callbacks);
        break;

      case 'openai':
      default:
        // OpenAI-compatible: append /chat/completions if not already present
        const endpoint = baseUrl.endsWith('/chat/completions') 
          ? baseUrl 
          : `${baseUrl.replace(/\/$/, '')}/chat/completions`;
        await streamOpenAICompatible(endpoint, apiKey, modelId, messages, callbacks);
        break;
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

// Anthropic streaming with custom base URL
async function streamAnthropicCustom(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const endpoint = baseUrl.endsWith('/messages') 
    ? baseUrl 
    : `${baseUrl.replace(/\/$/, '')}/v1/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage?.content || '',
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status})`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      if (response.status === 401) errorMessage = 'Invalid API key';
      else if (response.status === 429) errorMessage = 'Rate limit exceeded. Please wait and try again.';
      else if (response.status === 403) errorMessage = 'Access forbidden. Check your API key permissions.';
    }
    
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text;
          callbacks.onToken(parsed.delta.text);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  callbacks.onComplete(fullText);
}

// Gemini streaming with custom base URL
async function streamGeminiCustom(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Build endpoint URL based on base URL
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const endpoint = `${cleanBaseUrl}/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
      generationConfig: {
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status})`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      if (response.status === 400) errorMessage = 'Invalid request. Check your API key.';
      else if (response.status === 403) errorMessage = 'Access forbidden. Check your API key.';
      else if (response.status === 429) errorMessage = 'Rate limit exceeded. Please wait and try again.';
    }
    
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);

      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          fullText += text;
          callbacks.onToken(text);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  callbacks.onComplete(fullText);
}
