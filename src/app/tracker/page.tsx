'use client';

import { useState, useEffect } from 'react';
import {
  KanbanSquare,
  List,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  Database,
} from 'lucide-react';
import { KanbanColumn } from '@/components/tracker/KanbanColumn';
import { ApplicationCard } from '@/components/tracker/ApplicationCard';
import { ApplicationModal } from '@/components/tracker/ApplicationModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Application, ApplicationStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const STATUSES: ApplicationStatus[] = [
  'Interested',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
];

const LOCAL_STORAGE_KEY = 'remoteready_local_applications';

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  // Load applications from API (Neon PostgreSQL) with fallback to localStorage
  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();

      setIsDbConnected(Boolean(data.isDbConfigured));

      if (data.isDbConfigured && Array.isArray(data.applications)) {
        setApplications(data.applications);
      } else {
        // Fallback to localStorage if Neon DB not configured yet
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          setApplications(JSON.parse(local));
        } else {
          // Starter template applications for demo
          const sampleApps: Application[] = [
            {
              id: 'app_sample_1',
              company_name: 'Vercel',
              role_title: 'Full-Stack Developer (Next.js)',
              status: 'Interview',
              application_date: '2026-10-18',
              follow_up_date: '2026-10-30',
              salary: '110,000',
              currency: 'USD',
              location: 'Remote (Worldwide)',
              job_url: 'https://vercel.com/careers',
              notes: 'Technical screen passed with Engineering Manager.',
            },
            {
              id: 'app_sample_2',
              company_name: 'Automattic',
              role_title: 'Backend Systems Engineer',
              status: 'Applied',
              application_date: '2026-10-22',
              follow_up_date: '2026-11-04',
              salary: '95,000',
              currency: 'EUR',
              location: 'Remote',
              job_url: 'https://automattic.com/work-with-us',
              notes: 'Application submitted via Arbeitnow listing.',
            },
            {
              id: 'app_sample_3',
              company_name: 'Supabase',
              role_title: 'TypeScript SDK Developer',
              status: 'Interested',
              application_date: '2026-10-25',
              salary: '120,000',
              currency: 'USD',
              location: 'Remote',
              notes: 'Tailoring portfolio with PostgreSQL projects before applying.',
            },
          ];
          setApplications(sampleApps);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sampleApps));
        }
      }
    } catch (e) {
      console.warn('Tracker fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Save changes locally if Neon is not yet configured
  const syncLocalStorage = (updated: Application[]) => {
    if (!isDbConnected) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleCreateOrUpdate = async (appData: Partial<Application>) => {
    if (editingApp) {
      // Update existing
      const updatedList = applications.map((a) =>
        a.id === editingApp.id ? ({ ...a, ...appData, updated_at: new Date().toISOString() } as Application) : a
      );
      setApplications(updatedList);
      syncLocalStorage(updatedList);

      if (isDbConnected) {
        try {
          await fetch(`/api/applications/${editingApp.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData),
          });
        } catch (e) {
          console.error('Failed to update application in DB:', e);
        }
      }
    } else {
      // Create new
      const newApp: Application = {
        id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        company_name: appData.company_name || 'New Company',
        role_title: appData.role_title || 'Role',
        status: appData.status || 'Applied',
        application_date: appData.application_date || new Date().toISOString().split('T')[0],
        follow_up_date: appData.follow_up_date || null,
        salary: appData.salary || null,
        currency: appData.currency || 'USD',
        job_url: appData.job_url || null,
        location: appData.location || 'Remote',
        notes: appData.notes || null,
        created_at: new Date().toISOString(),
      };

      const updatedList = [newApp, ...applications];
      setApplications(updatedList);
      syncLocalStorage(updatedList);

      if (isDbConnected) {
        try {
          await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newApp),
          });
        } catch (e) {
          console.error('Failed to persist new application in DB:', e);
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    const updatedList = applications.filter((a) => a.id !== id);
    setApplications(updatedList);
    syncLocalStorage(updatedList);

    if (isDbConnected) {
      try {
        await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete application in DB:', e);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    const updatedList = applications.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setApplications(updatedList);
    syncLocalStorage(updatedList);

    if (isDbConnected) {
      try {
        await fetch(`/api/applications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (e) {
        console.error('Failed to update status in DB:', e);
      }
    }
  };

  // Filtered applications
  const filteredApps = applications.filter(
    (a) =>
      a.company_name.toLowerCase().includes(search.toLowerCase()) ||
      a.role_title.toLowerCase().includes(search.toLowerCase()) ||
      (a.location && a.location.toLowerCase().includes(search.toLowerCase())) ||
      (a.notes && a.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Application Tracker</h1>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                isDbConnected
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40'
                  : 'bg-amber-950 text-amber-300 border-amber-800/40'
              }`}
            >
              {isDbConnected ? 'Neon PostgreSQL Persisted' : 'Neon DB Unconnected (Temporary Local Session)'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organize your career funnel from initial interest to offer letters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isDbConnected && (
            <button
              onClick={() => setShowSetupHelp(!showSetupHelp)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium"
            >
              {showSetupHelp ? 'Hide Neon Setup' : 'Connect Neon Database'}
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-navy-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Kanban Board View"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingApp(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Neon Database Missing Notice */}
      {!isDbConnected && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 text-xs text-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Database className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Neon PostgreSQL DATABASE_URL is not configured</span>
            </div>
            <button
              onClick={() => setShowSetupHelp(!showSetupHelp)}
              className="text-amber-300 underline font-mono text-[11px]"
            >
              {showSetupHelp ? 'Hide Setup Steps' : 'View Setup Steps'}
            </button>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Applications are temporarily held in local browser state and will not be preserved across different devices or incognito sessions. Real database persistence will activate automatically once your Neon PostgreSQL connection string is supplied.
          </p>

          {showSetupHelp && (
            <div className="mt-3 p-3 bg-navy-950/90 rounded-lg border border-amber-900/40 space-y-2 text-slate-300">
              <p className="font-semibold text-slate-200">Required Neon Setup Steps:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                <li>
                  Create a serverless Postgres project at <a href="https://console.neon.tech" target="_blank" className="text-cyan-400 underline">console.neon.tech</a>.
                </li>
                <li>
                  Copy your connection URI and set it in <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">.env.local</code>:
                  <pre className="mt-1 p-2 bg-slate-900 rounded font-mono text-[10px] text-cyan-300 overflow-x-auto">
DATABASE_URL=&quot;postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require&quot;
                  </pre>
                </li>
                <li>
                  Execute <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-400">database/schema.sql</code> in the Neon SQL Editor (or allow our auto-migrator to initialize tables on restart).
                </li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Filter and Metrics Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-navy-900/60 border border-slate-800/80 rounded-xl p-3.5">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter companies, roles..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
          {STATUSES.map((st) => {
            const count = applications.filter((a) => a.status === st).length;
            return (
              <span
                key={st}
                className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/40 text-slate-300"
              >
                {st}: <strong className="text-cyan-400">{count}</strong>
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Board / View */}
      {loading ? (
        <LoadingSpinner label="Loading application board..." />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No Tracked Applications Yet"
          description="Begin tracking your job applications by clicking 'Add Application' or save jobs directly from the Remote Job Feed."
          icon={KanbanSquare}
          actionLabel="Create First Application"
          onAction={() => setModalOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        /* Kanban Board Horizontal Scrollable */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={filteredApps.filter((a) => a.status === status)}
              onEdit={(app) => {
                setEditingApp(app);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onAddNew={(st) => {
                setEditingApp({
                  id: '',
                  company_name: '',
                  role_title: '',
                  status: st,
                  currency: 'USD',
                });
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-navy-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-navy-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3">Company & Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Target Salary</th>
                  <th className="px-4 py-3">Follow-Up Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{app.role_title}</div>
                      <div className="text-[11px] text-cyan-400">{app.company_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{app.location || 'Remote'}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      {app.salary ? `${app.salary} ${app.currency}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {formatDate(app.follow_up_date) || '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingApp(app);
                          setModalOpen(true);
                        }}
                        className="text-cyan-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="text-rose-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Application Modal */}
      <ApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreateOrUpdate}
        initialData={editingApp}
      />
    </div>
  );
}
