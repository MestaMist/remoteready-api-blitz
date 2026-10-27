'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Compass,
  Briefcase,
  KanbanSquare,
  Calculator,
  Radio,
  CalendarDays,
  Globe2,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: Compass },
  { label: 'Remote Job Feed', href: '/jobs', icon: Briefcase },
  { label: 'Applications', href: '/tracker', icon: KanbanSquare },
  { label: 'Salary Converter', href: '/salary-calculator', icon: Calculator },
  { label: 'Tech Radar', href: '/tech-radar', icon: Radio },
  { label: 'Application Planner', href: '/planner', icon: CalendarDays },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-navy-900 border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                <Globe2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-100">RemoteReady</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-medium text-slate-300">RemoteReady 2026</p>
          <p className="text-[11px] text-slate-500 mt-0.5">5 APIs Powered Career Platform</p>
        </div>
      </div>
    </div>
  );
}
