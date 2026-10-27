'use client';

import { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';

interface DbStatusBannerProps {
  onStatusChange?: (connected: boolean) => void;
}

export function DbStatusBanner({ onStatusChange }: DbStatusBannerProps) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function checkDb() {
      try {
        const res = await fetch('/api/db/status');
        const data = await res.json();
        setConnected(data.connected);
        setMessage(data.message || '');
        if (onStatusChange) onStatusChange(data.connected);
      } catch (err) {
        setConnected(false);
        setMessage('Could not verify Neon database status.');
        if (onStatusChange) onStatusChange(false);
      } finally {
        setLoading(false);
      }
    }
    checkDb();
  }, [onStatusChange]);

  if (loading || dismissed) return null;

  return (
    <div
      className={`border-b text-xs transition-all ${
        connected
          ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200'
          : 'bg-amber-950/30 border-amber-900/50 text-amber-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {connected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="font-medium">
            {connected
              ? 'Neon PostgreSQL Active: Data is persisting directly to your server database.'
              : 'Neon DB Not Configured: DATABASE_URL is missing in .env.local. Server database persistence is inactive.'}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="underline underline-offset-2 ml-1 hover:text-white font-mono"
          >
            {showDetails ? 'Hide instructions' : 'View Neon setup instructions'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!connected && (
            <a
              href="https://console.neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-medium border border-amber-500/30"
            >
              Neon Console <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="max-w-7xl mx-auto px-4 pb-3 sm:px-6 pt-1 border-t border-amber-900/30 text-slate-300 text-xs">
          <div className="bg-navy-900/90 rounded p-3 border border-slate-800 space-y-2">
            <p className="font-semibold text-slate-200">How to activate Neon PostgreSQL persistence:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Log in to your <a href="https://console.neon.tech" target="_blank" className="text-cyan-400 underline">Neon Console</a> and create or open a project.</li>
              <li>Copy your Postgres connection string from the dashboard (e.g. <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">postgresql://neondb_owner:***@ep-***.neon.tech/neondb?sslmode=require</code>).</li>
              <li>Create or edit <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300">.env.local</code> in this project and add: <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300">DATABASE_URL=&quot;your_connection_string&quot;</code>.</li>
              <li>Execute <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300">database/schema.sql</code> in the Neon SQL Editor (or let our auto-migrator run automatically on first start).</li>
            </ol>
            <p className="text-slate-400 text-[11px] pt-1">
              Note: The database client (`@neondatabase/serverless`) is fully wired in `src/lib/db.ts` and will activate automatically once `DATABASE_URL` is set.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
