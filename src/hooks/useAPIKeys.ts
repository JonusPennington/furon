import { useState, useEffect, useCallback } from 'react';
import { APIKeys, ProviderKey } from '@/types/chat';
import { storage } from '@/lib/storage';

export function useAPIKeys() {
  const [apiKeys, setApiKeys] = useState<APIKeys>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load keys on mount
  useEffect(() => {
    storage.getAPIKeys().then(keys => {
      setApiKeys(keys);
      setIsLoaded(true);
    });
  }, []);

  const updateApiKey = useCallback(async (provider: ProviderKey, key: string) => {
    const updated = { ...apiKeys };
    if (key && key.trim()) {
      updated[provider] = key.trim();
    } else {
      delete updated[provider];
    }
    setApiKeys(updated);
    await storage.saveAPIKeys(updated);
  }, [apiKeys]);

  const clearApiKey = useCallback(async (provider: ProviderKey) => {
    const updated = { ...apiKeys };
    delete updated[provider];
    setApiKeys(updated);
    await storage.saveAPIKeys(updated);
  }, [apiKeys]);

  const hasAnyKey = Object.values(apiKeys).some(key => !!key);

  const hasKeyForProvider = useCallback((provider: ProviderKey): boolean => {
    return !!apiKeys[provider];
  }, [apiKeys]);

  const getAvailableProviders = useCallback((): ProviderKey[] => {
    return Object.entries(apiKeys)
      .filter(([_, value]) => !!value)
      .map(([key]) => key as ProviderKey);
  }, [apiKeys]);

  return {
    apiKeys,
    isLoaded,
    updateApiKey,
    clearApiKey,
    hasAnyKey,
    hasKeyForProvider,
    getAvailableProviders,
  };
}
