import { useState, useEffect, useCallback } from 'react';
import { storage, UserPreferences } from '@/lib/storage';

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    defaultMode: 'general',
    selectedModel: null,
    temperature: 0.7,
    maxTokens: 4096,
    wartimeMode: false,
    showReasoning: false,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getPreferences().then(prefs => {
      setPreferences(prefs);
      // Apply theme on load
      document.documentElement.classList.toggle('dark', prefs.theme === 'dark');
      setIsLoaded(true);
    });
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    await storage.savePreferences(updated);
    
    // Apply theme changes immediately
    if (updates.theme) {
      document.documentElement.classList.toggle('dark', updates.theme === 'dark');
    }
  }, [preferences]);

  const toggleTheme = useCallback(() => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
  }, [preferences.theme, updatePreferences]);

  const setSelectedModel = useCallback((modelId: string | null) => {
    updatePreferences({ selectedModel: modelId });
  }, [updatePreferences]);

  return {
    preferences,
    isLoaded,
    updatePreferences,
    toggleTheme,
    setSelectedModel,
  };
}
