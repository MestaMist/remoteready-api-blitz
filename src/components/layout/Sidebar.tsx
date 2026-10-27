'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Briefcase,
  KanbanSquare,
  Calculator,
  Radio,
  CalendarDays,
  Globe2,
  Database,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: Compass },
  { label: 'Remote Job Feed', href: '/jobs', icon: Briefcase },
  { label: 'Applications', href: '/tracker', icon: KanbanSquare },
  { label: 'Salary Converter', href: '/salary-calculator', icon: Calculator },
  { label: 'Tech Radar', href: '/tech-radar', icon: Radio },
  { label: 'Application Planner', href: '/planner', icon: CalendarDays },
];

const API_BADGES = [
  { name: 'Remotive', status: 'live' },
  { name: 'Arbeitnow', status: 'live' },
  { name: 'Frankfurter', status: 'live' },
  { name: 'Nager.Date', status: 'live' },
  { name: 'Hacker News', status: 'live' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-navy-900/90 backdrop-blur-md h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/70">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 tracking-tight text-base">RemoteReady</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Career & Remote Hub</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.href === '/jobs' && (
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                  Live
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Integrated APIs Status Panel */}
      <div className="p-4 border-t border-slate-800/70 bg-navy-950/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            API Blitz Integrations
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {API_BADGES.map((api) => (
            <div
              key={api.name}
              className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]"
            >
              <span className="text-slate-300">{api.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Connected
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Neon PostgreSQL
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">Serverless</span>
        </div>
      </div>
    </aside>
  );
}
