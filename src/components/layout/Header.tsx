'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, PlusCircle, Search, Sparkles, Globe2, Layers } from 'lucide-react';
import { MobileNav } from './MobileNav';

interface HeaderProps {
  onOpenNewApplication?: () => void;
}

export function Header({ onOpenNewApplication }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-navy-900/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Globe2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-100 text-sm">RemoteReady</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
              API Blitz 2026 Edition
            </span>
            <span>•</span>
            <span>Live Aggregation & Career Planner</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/jobs"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/50 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search jobs...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px] font-mono border border-slate-800">
              /
            </kbd>
          </Link>

          <Link
            href="/tracker?new=1"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-sm shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Track Application</span>
          </Link>
        </div>
      </header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
