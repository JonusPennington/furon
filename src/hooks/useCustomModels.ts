import { useState, useEffect, useCallback } from 'react';
import { CustomModel } from '@/types/chat';
import { storage } from '@/lib/storage';

export function useCustomModels() {
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load models on mount
  useEffect(() => {
    storage.getCustomModels().then(models => {
      setCustomModels(models);
      setIsLoaded(true);
    });
  }, []);

  const addCustomModel = useCallback(async (model: Omit<CustomModel, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newModel: CustomModel = {
      ...model,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updated = [...customModels, newModel];
    setCustomModels(updated);
    await storage.saveCustomModel(newModel);
    return newModel;
  }, [customModels]);

  const updateCustomModel = useCallback(async (id: string, updates: Partial<Omit<CustomModel, 'id' | 'createdAt'>>) => {
    const updated = customModels.map(model => 
      model.id === id 
        ? { ...model, ...updates, updatedAt: new Date() }
        : model
    );
    setCustomModels(updated);
    const updatedModel = updated.find(m => m.id === id);
    if (updatedModel) {
      await storage.saveCustomModel(updatedModel);
    }
  }, [customModels]);

  const deleteCustomModel = useCallback(async (id: string) => {
    const updated = customModels.filter(m => m.id !== id);
    setCustomModels(updated);
    await storage.deleteCustomModel(id);
  }, [customModels]);

  const reorderCustomModels = useCallback(async (models: CustomModel[]) => {
    setCustomModels(models);
    await storage.saveCustomModels(models);
  }, []);

  return {
    customModels,
    isLoaded,
    addCustomModel,
    updateCustomModel,
    deleteCustomModel,
    reorderCustomModels,
  };
}
