import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  colorScheme?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'purple';
}

const COLOR_MAP = {
  cyan: {
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    badge: 'bg-cyan-950 text-cyan-300 border-cyan-800/40',
  },
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    badge: 'bg-blue-950 text-blue-300 border-blue-800/40',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800/40',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    badge: 'bg-amber-950 text-amber-300 border-amber-800/40',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    badge: 'bg-purple-950 text-purple-300 border-purple-800/40',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  colorScheme = 'cyan',
}: StatCardProps) {
  const colors = COLOR_MAP[colorScheme];

  return (
    <div className="bg-navy-900/80 border border-slate-800/80 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg border ${colors.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtitle || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{subtitle}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${colors.badge}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
