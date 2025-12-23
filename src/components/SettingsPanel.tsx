import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Eye, EyeOff, Check, X, Shield, ExternalLink, Flame, Thermometer, Hash, Moon, Sun, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APIKeys, LLM_PROVIDERS, ProviderKey, CustomModel } from '@/types/chat';
import { cn } from '@/lib/utils';
import { maskApiKey } from '@/lib/encryption';
import { CustomModelsSection } from './CustomModelsSection';

interface SettingsPanelProps {
  apiKeys: APIKeys;
  onUpdateKey: (provider: ProviderKey, key: string) => void;
  onClearKey: (provider: ProviderKey) => void;
  temperature?: number;
  maxTokens?: number;
  wartimeMode?: boolean;
  onTemperatureChange?: (value: number) => void;
  onMaxTokensChange?: (value: number) => void;
  onWartimeModeChange?: (value: boolean) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  variant?: 'header' | 'sidebar';
  // Custom Models props
  customModels?: CustomModel[];
  onAddCustomModel?: (model: Omit<CustomModel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomModel>;
  onUpdateCustomModel?: (id: string, updates: Partial<Omit<CustomModel, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteCustomModel?: (id: string) => Promise<void>;
  onReorderCustomModels?: (models: CustomModel[]) => Promise<void>;
}

const API_KEY_LINKS: Record<ProviderKey, string> = {
  grok: 'https://console.x.ai/',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  gemini: 'https://aistudio.google.com/app/apikey',
  deepseek: 'https://platform.deepseek.com/api_keys',
  qwen: 'https://dashscope.console.aliyun.com/apiKey',
  perplexity: 'https://www.perplexity.ai/settings/api',
  gab: 'https://gab.ai/settings/api',
  kimi: 'https://platform.moonshot.cn/console/api-keys',
  openrouter: 'https://openrouter.ai/keys',
  meta: 'https://openrouter.ai/keys',
  mistral: 'https://console.mistral.ai/api-keys/',
};

const PROVIDER_CATEGORIES = [
  {
    name: 'Premium Reasoning',
    description: 'Best for complex analysis and code',
    providers: ['anthropic', 'openai', 'deepseek'],
  },
  {
    name: 'Research & Search',
    description: 'Real-time web search with citations',
    providers: ['perplexity', 'gemini'],
  },
  {
    name: 'Multilingual & Global',
    description: 'Strong multilingual capabilities',
    providers: ['qwen', 'mistral', 'kimi'],
  },
  {
    name: 'Open & Alternative',
    description: 'Open models and alternatives',
    providers: ['meta', 'grok', 'gab'],
  },
  {
    name: 'Unified Access',
    description: 'One key for 100+ models',
    providers: ['openrouter'],
  },
];

export function SettingsPanel({ 
  apiKeys, 
  onUpdateKey, 
  onClearKey,
  temperature = 0.7,
  maxTokens = 4096,
  wartimeMode = false,
  onTemperatureChange,
  onMaxTokensChange,
  onWartimeModeChange,
  theme = 'dark',
  onToggleTheme,
  variant = 'header',
  customModels = [],
  onAddCustomModel,
  onUpdateCustomModel,
  onDeleteCustomModel,
  onReorderCustomModels,
}: SettingsPanelProps) {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Premium Reasoning');

  const connectedCount = Object.values(apiKeys).filter(Boolean).length;
  const totalConnected = connectedCount + customModels.length;

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (provider: ProviderKey, value: string) => {
    setEditingKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleSaveKey = (provider: ProviderKey) => {
    const value = editingKeys[provider];
    if (value !== undefined && value.trim()) {
      onUpdateKey(provider, value.trim());
      setEditingKeys(prev => {
        const updated = { ...prev };
        delete updated[provider];
        return updated;
      });
    }
  };

  const handleCancelEdit = (provider: ProviderKey) => {
    setEditingKeys(prev => {
      const updated = { ...prev };
      delete updated[provider];
      return updated;
    });
  };

  const startEditing = (provider: ProviderKey) => {
    setEditingKeys(prev => ({ ...prev, [provider]: '' }));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {variant === 'sidebar' ? (
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
            {totalConnected > 0 && (
              <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {totalConnected}
              </span>
            )}
          </button>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-secondary relative">
            <Settings className="h-5 w-5" />
            {totalConnected > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                {totalConnected}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg glass-strong border-border/50 p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="gradient-text">Settings</SheetTitle>
          <SheetDescription>
            Configure API keys and preferences. {totalConnected} provider{totalConnected !== 1 ? 's' : ''} connected.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Appearance Section */}
            <div className="pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Appearance</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span className="text-sm">Theme</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onToggleTheme} className="gap-2">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Model Parameters */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Model Parameters
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Temperature (Creativity)</Label>
                    <span className="text-sm font-mono text-muted-foreground">{temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[temperature]}
                    onValueChange={([v]) => onTemperatureChange?.(v)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      Max Tokens
                    </Label>
                    <span className="text-sm font-mono text-muted-foreground">{maxTokens}</span>
                  </div>
                  <Slider
                    value={[maxTokens]}
                    onValueChange={([v]) => onMaxTokensChange?.(v)}
                    min={256}
                    max={8192}
                    step={256}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum response length
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Wartime Mode Toggle */}
            <div className={cn(
              'p-4 rounded-xl border transition-all',
              wartimeMode 
                ? 'border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10' 
                : 'border-border/50 bg-secondary/20'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame className={cn('w-5 h-5', wartimeMode ? 'text-orange-500' : 'text-muted-foreground')} />
                  <div>
                    <Label className="text-sm font-semibold">Wartime Mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Amplify urgency in Innovation responses
                    </p>
                  </div>
                </div>
                <Switch
                  checked={wartimeMode}
                  onCheckedChange={onWartimeModeChange}
                />
              </div>
            </div>

            <Separator />

            {/* API Keys Section - Categorized */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">API Keys</h3>
              
              <div className="space-y-3">
                {PROVIDER_CATEGORIES.map((category) => {
                  const categoryProviders = LLM_PROVIDERS.filter(p => 
                    category.providers.includes(p.id)
                  );
                  const connectedInCategory = categoryProviders.filter(p => !!apiKeys[p.id]).length;
                  const isExpanded = expandedCategory === category.name;

                  return (
                    <div key={category.name} className="border border-border/50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                        className="w-full p-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{category.name}</span>
                            {connectedInCategory > 0 && (
                              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                {connectedInCategory}/{categoryProviders.length}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        <ChevronIcon className={cn(
                          'w-4 h-4 text-muted-foreground transition-transform',
                          isExpanded && 'rotate-180'
                        )} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border/50 p-3 space-y-3 bg-secondary/10">
                          {categoryProviders.map((provider) => {
                            const hasKey = !!apiKeys[provider.id];
                            const isEditing = editingKeys[provider.id] !== undefined;
                            const inputValue = isEditing ? editingKeys[provider.id] : '';

                            return (
                              <div
                                key={provider.id}
                                className={cn(
                                  'p-3 rounded-lg border transition-all',
                                  hasKey 
                                    ? 'border-primary/30 bg-primary/5' 
                                    : 'border-border/30 bg-background/50'
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm font-semibold">{provider.name}</Label>
                                      <a
                                        href={API_KEY_LINKS[provider.id]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        title="Get API key"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                                  </div>
                                  {hasKey && !isEditing && (
                                    <span className="flex items-center gap-1 text-xs text-primary shrink-0">
                                      <Check size={12} />
                                    </span>
                                  )}
                                </div>

                                {/* Available Models - Compact */}
                                <div className="mb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {provider.models.slice(0, 3).map((model) => (
                                      <span
                                        key={model.id}
                                        className={cn(
                                          'px-1.5 py-0.5 text-[10px] rounded border',
                                          hasKey 
                                            ? 'bg-primary/10 border-primary/20 text-primary'
                                            : 'bg-secondary/50 border-border/30 text-muted-foreground'
                                        )}
                                        title={model.description}
                                      >
                                        {model.name}
                                      </span>
                                    ))}
                                    {provider.models.length > 3 && (
                                      <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        +{provider.models.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Key Input */}
                                {isEditing ? (
                                  <div className="flex gap-1.5">
                                    <div className="relative flex-1">
                                      <Input
                                        type={showKeys[provider.id] ? 'text' : 'password'}
                                        value={inputValue}
                                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                                        placeholder="Paste API key..."
                                        className="pr-8 h-8 text-xs bg-background/50 border-border/50 font-mono"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => toggleShowKey(provider.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                      >
                                        {showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleSaveKey(provider.id)}
                                      disabled={!inputValue.trim()}
                                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                      <Check size={14} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleCancelEdit(provider.id)}
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    >
                                      <X size={14} />
                                    </Button>
                                  </div>
                                ) : hasKey ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex-1 px-2 py-1 rounded bg-background/30 border border-border/30 font-mono text-xs text-muted-foreground">
                                      {maskApiKey(apiKeys[provider.id] || '')}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditing(provider.id)}
                                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      Update
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onClearKey(provider.id)}
                                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(provider.id)}
                                    className="w-full h-7 text-xs border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
                                  >
                                    + Add API Key
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Custom Models Section */}
            {onAddCustomModel && onUpdateCustomModel && onDeleteCustomModel && onReorderCustomModels && (
              <>
                <CustomModelsSection
                  customModels={customModels}
                  onAdd={onAddCustomModel}
                  onUpdate={onUpdateCustomModel}
                  onDelete={onDeleteCustomModel}
                  onReorder={onReorderCustomModels}
                />
                <Separator />
              </>
            )}

            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Secure Storage</p>
                  <p className="text-xs text-muted-foreground">
                    Your API keys are encrypted using AES-256-GCM and stored locally in your browser. 
                    They are never sent to our servers.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* About Link */}
            <Link to="/about" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">About Furon AI</span>
            </Link>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
