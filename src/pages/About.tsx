import { BuckeyeLeafLogo } from '@/components/BuckeyeLeafLogo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <BuckeyeLeafLogo size="md" />
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <div className="flex justify-center mb-8">
            <BuckeyeLeafLogo size="lg" />
          </div>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            <a 
              href="https://www.furon.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground font-semibold hover:text-primary transition-colors"
            >
              Furon AI
            </a>
            {' '}— Internal innovation accelerator for{' '}
            <a 
              href="https://www.furon.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground font-semibold hover:text-primary transition-colors"
            >
              Furon R&D Lab
            </a>
            . Built for urgency and breakthroughs.
          </p>

          <a 
            href="https://www.furon.co" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button size="lg" className="gap-2">
              Visit furon.co
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}{' '}
            <a 
              href="https://www.furon.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 hover:text-foreground transition-colors"
            >
              Furon AI
            </a>
            . All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}