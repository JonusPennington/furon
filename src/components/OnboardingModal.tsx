import { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Flame, Zap, FlaskConical, Settings, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import furonLogo from '@/assets/furon-logo.png';

interface OnboardingModalProps {
  onComplete: () => void;
  onOpenSettings: () => void;
}

const ONBOARDING_KEY = 'furon-onboarding-complete';

export function OnboardingModal({ onComplete, onOpenSettings }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompleted) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
    onComplete();
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleSetupKeys = () => {
    handleClose();
    onOpenSettings();
  };

  const steps = [
    {
      title: 'Welcome to Furon AI',
      icon: <img src={furonLogo} alt="Furon" className="w-16 h-16 object-contain dark:invert-0 invert" />,
      content: (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your AI-powered R&D innovation partner. Accelerate breakthrough discoveries across AI/ML, space exploration, biotech, and more.
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">Powered by leading AI models</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Choose Your Mode',
      icon: <MessageSquare className="w-12 h-12 text-primary" />,
      content: (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <MessageSquare className="w-5 h-5 text-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">General</p>
              <p className="text-sm text-muted-foreground">Open conversation and Q&A</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Innovation War Room</p>
              <p className="text-sm text-muted-foreground">Wartime intensity brainstorming</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <Zap className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Prototype Builder</p>
              <p className="text-sm text-muted-foreground">Build apps with live code preview</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <FlaskConical className="w-5 h-5 text-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Research Synthesis</p>
              <p className="text-sm text-muted-foreground">Analyze and connect research</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Set Up Your API Keys',
      icon: <Settings className="w-12 h-12 text-primary" />,
      content: (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Connect your preferred AI providers to unlock Furon AI's full potential.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-secondary/50 text-foreground">OpenAI GPT</div>
            <div className="p-2 rounded-lg bg-secondary/50 text-foreground">Anthropic Claude</div>
            <div className="p-2 rounded-lg bg-secondary/50 text-foreground">Google Gemini</div>
            <div className="p-2 rounded-lg bg-secondary/50 text-foreground">xAI Grok</div>
          </div>
          <Button onClick={handleSetupKeys} className="w-full mt-4">
            <Settings className="w-4 h-4 mr-2" />
            Set Up API Keys Now
          </Button>
          <button 
            onClick={handleNext}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {currentStep.icon}
          </div>
          <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {currentStep.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          {step < steps.length - 1 && (
            <Button onClick={handleNext} size="sm">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useOnboardingComplete() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
