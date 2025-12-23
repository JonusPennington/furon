import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, GripVertical, ChevronDown, Pencil, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomModel, ApiFormat } from '@/types/chat';
import { cn } from '@/lib/utils';
import { maskApiKey } from '@/lib/encryption';

interface CustomModelsSectionProps {
  customModels: CustomModel[];
  onAdd: (model: Omit<CustomModel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomModel>;
  onUpdate: (id: string, updates: Partial<Omit<CustomModel, 'id' | 'createdAt'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (models: CustomModel[]) => Promise<void>;
}

interface EditingModel {
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  apiFormat: ApiFormat;
  description: string;
}

const DEFAULT_MODEL: EditingModel = {
  name: '',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelId: '',
  apiFormat: 'openai',
  description: '',
};

const PRESET_URLS: { label: string; url: string; format: ApiFormat }[] = [
  { label: 'OpenAI', url: 'https://api.openai.com/v1', format: 'openai' },
  { label: 'Anthropic', url: 'https://api.anthropic.com', format: 'anthropic' },
  { label: 'Google Gemini', url: 'https://generativelanguage.googleapis.com', format: 'gemini' },
  { label: 'DeepSeek', url: 'https://api.deepseek.com/v1', format: 'openai' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', format: 'openai' },
  { label: 'Groq', url: 'https://api.groq.com/openai/v1', format: 'openai' },
  { label: 'Together AI', url: 'https://api.together.xyz/v1', format: 'openai' },
  { label: 'Mistral', url: 'https://api.mistral.ai/v1', format: 'openai' },
  { label: 'Ollama (local)', url: 'http://localhost:11434/v1', format: 'openai' },
  { label: 'LM Studio (local)', url: 'http://localhost:1234/v1', format: 'openai' },
];

const API_FORMAT_OPTIONS: { value: ApiFormat; label: string; description: string }[] = [
  { value: 'openai', label: 'OpenAI Compatible', description: 'OpenAI, DeepSeek, Qwen, OpenRouter, Groq, Together, Ollama, LM Studio, Mistral, and most providers' },
  { value: 'anthropic', label: 'Anthropic', description: 'For Claude models via Anthropic API' },
  { value: 'gemini', label: 'Google Gemini', description: 'For Gemini models via Google AI API' },
];

export function CustomModelsSection({
  customModels,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: CustomModelsSectionProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newModel, setNewModel] = useState<EditingModel>(DEFAULT_MODEL);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<EditingModel>(DEFAULT_MODEL);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddNew = async () => {
    if (!newModel.name.trim() || !newModel.baseUrl.trim() || !newModel.modelId.trim()) {
      return;
    }

    await onAdd({
      name: newModel.name.trim(),
      baseUrl: newModel.baseUrl.trim(),
      apiKey: newModel.apiKey.trim(),
      modelId: newModel.modelId.trim(),
      apiFormat: newModel.apiFormat,
      description: newModel.description.trim(),
    });

    setNewModel(DEFAULT_MODEL);
    setIsAddingNew(false);
  };

  const handleStartEdit = (model: CustomModel) => {
    setEditingId(model.id);
    setEditingModel({
      name: model.name,
      baseUrl: model.baseUrl,
      apiKey: model.apiKey,
      modelId: model.modelId,
      apiFormat: model.apiFormat || 'openai',
      description: model.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingModel.name.trim() || !editingModel.baseUrl.trim() || !editingModel.modelId.trim()) {
      return;
    }

    await onUpdate(editingId, {
      name: editingModel.name.trim(),
      baseUrl: editingModel.baseUrl.trim(),
      apiKey: editingModel.apiKey.trim(),
      modelId: editingModel.modelId.trim(),
      apiFormat: editingModel.apiFormat,
      description: editingModel.description.trim(),
    });

    setEditingId(null);
    setEditingModel(DEFAULT_MODEL);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingModel(DEFAULT_MODEL);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = customModels.findIndex(m => m.id === draggedId);
    const targetIndex = customModels.findIndex(m => m.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newModels = [...customModels];
    const [draggedModel] = newModels.splice(draggedIndex, 1);
    newModels.splice(targetIndex, 0, draggedModel);
    
    onReorder(newModels);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handlePresetSelect = (preset: typeof PRESET_URLS[0], model: EditingModel, setModel: (m: EditingModel) => void) => {
    setModel({ 
      ...model, 
      baseUrl: preset.url,
      apiFormat: preset.format 
    });
  };

  const renderModelForm = (
    model: EditingModel,
    setModel: (m: EditingModel) => void,
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string
  ) => (
    <div className="space-y-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Model Name *</Label>
          <Input
            value={model.name}
            onChange={(e) => setModel({ ...model, name: e.target.value })}
            placeholder="e.g., My DeepSeek R1"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Model ID *</Label>
          <Input
            value={model.modelId}
            onChange={(e) => setModel({ ...model, modelId: e.target.value })}
            placeholder="e.g., deepseek-reasoner"
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">API Format *</Label>
        <select
          className="w-full h-8 px-2 text-sm rounded-md border border-border/50 bg-background"
          value={model.apiFormat}
          onChange={(e) => setModel({ ...model, apiFormat: e.target.value as ApiFormat })}
        >
          {API_FORMAT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {API_FORMAT_OPTIONS.find(o => o.value === model.apiFormat)?.description}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Base URL *</Label>
        <div className="flex gap-2">
          <Input
            value={model.baseUrl}
            onChange={(e) => setModel({ ...model, baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
            className="h-8 text-sm font-mono flex-1"
          />
          <select
            className="h-8 px-2 text-xs rounded-md border border-border/50 bg-background"
            value=""
            onChange={(e) => {
              const preset = PRESET_URLS.find(p => p.url === e.target.value);
              if (preset) {
                handlePresetSelect(preset, model, setModel);
              }
            }}
          >
            <option value="">Presets...</option>
            {PRESET_URLS.map(preset => (
              <option key={preset.url} value={preset.url}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">API Key (optional for local models)</Label>
        <Input
          type="password"
          value={model.apiKey}
          onChange={(e) => setModel({ ...model, apiKey: e.target.value })}
          placeholder="sk-..."
          className="h-8 text-sm font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description (optional)</Label>
        <Input
          value={model.description}
          onChange={(e) => setModel({ ...model, description: e.target.value })}
          placeholder="What's this model good for?"
          className="h-8 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!model.name.trim() || !model.baseUrl.trim() || !model.modelId.trim()}
          className="h-7 text-xs"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );

  const getFormatLabel = (format: ApiFormat) => 
    API_FORMAT_OPTIONS.find(o => o.value === format)?.label || 'OpenAI Compatible';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Custom Models
          </h4>
          <p className="text-xs text-muted-foreground">
            Add your own API endpoints from any provider
          </p>
        </div>
        {!isAddingNew && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingNew(true)}
            className="h-7 text-xs gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Model
          </Button>
        )}
      </div>

      {/* Add New Form */}
      {isAddingNew && renderModelForm(
        newModel,
        setNewModel,
        handleAddNew,
        () => {
          setIsAddingNew(false);
          setNewModel(DEFAULT_MODEL);
        },
        'Add Model'
      )}

      {/* Existing Models */}
      {customModels.length > 0 && (
        <div className="space-y-2">
          {customModels.map((model) => {
            const isExpanded = expandedIds.has(model.id);
            const isEditing = editingId === model.id;
            const isDragging = draggedId === model.id;

            return (
              <div
                key={model.id}
                draggable
                onDragStart={(e) => handleDragStart(e, model.id)}
                onDragOver={(e) => handleDragOver(e, model.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'border rounded-lg transition-all',
                  isDragging ? 'opacity-50 border-primary' : 'border-border/50',
                  isExpanded ? 'bg-secondary/10' : 'bg-background/50'
                )}
              >
                {/* Header */}
                <div className="flex items-center gap-2 p-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                  
                  <button
                    onClick={() => toggleExpanded(model.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{model.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {model.modelId}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleStartEdit(model)}
                      className="h-7 w-7"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(model.id)}
                      className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/30">
                    {isEditing ? (
                      renderModelForm(
                        editingModel,
                        setEditingModel,
                        handleSaveEdit,
                        handleCancelEdit,
                        'Save Changes'
                      )
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-16">Format:</span>
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">
                            {getFormatLabel(model.apiFormat || 'openai')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-16">Base URL:</span>
                          <span className="font-mono truncate">{model.baseUrl}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-16">API Key:</span>
                          <span className="font-mono">
                            {model.apiKey ? (
                              <span className="flex items-center gap-1">
                                {showApiKey[model.id] ? model.apiKey : maskApiKey(model.apiKey)}
                                <button
                                  onClick={() => setShowApiKey(prev => ({ ...prev, [model.id]: !prev[model.id] }))}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {showApiKey[model.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Not set</span>
                            )}
                          </span>
                        </div>
                        {model.description && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-16 shrink-0">Notes:</span>
                            <span className="text-muted-foreground">{model.description}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {customModels.length === 0 && !isAddingNew && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No custom models yet</p>
          <p className="text-xs">Add models from Ollama, LM Studio, Anthropic, Gemini, or any API</p>
        </div>
      )}
    </div>
  );
}
