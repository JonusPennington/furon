import furonLogo from '@/assets/furon-logo.png';

interface BuckeyeLeafLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function BuckeyeLeafLogo({ size = 'md', showText = true }: BuckeyeLeafLogoProps) {
  const sizes = {
    sm: { height: 32, text: 'text-lg' },
    md: { height: 40, text: 'text-xl' },
    lg: { height: 48, text: 'text-3xl' },
  };

  const { height, text } = sizes[size];

  return (
    <a 
      href="https://www.furon.co" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <img 
        src={furonLogo} 
        alt="Furon Logo" 
        style={{ height: `${height}px` }}
        className="object-contain dark:invert-0 invert"
      />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-semibold ${text} text-foreground`}>
            Furon
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            AI
          </span>
        </div>
      )}
    </a>
  );
}