import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  label = 'Loading data...',
  className = 'py-12',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-slate-400 ${className}`}>
      <div className="relative">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
      <p className="text-xs font-mono tracking-wide">{label}</p>
    </div>
  );
}
