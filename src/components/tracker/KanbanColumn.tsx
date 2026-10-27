'use client';

import { Application, ApplicationStatus } from '@/lib/types';
import { ApplicationCard } from './ApplicationCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onAddNew: (status: ApplicationStatus) => void;
}

const COLUMN_CONFIG: Record<ApplicationStatus, { label: string; dotColor: string; headerBg: string }> = {
  Interested: {
    label: 'Interested',
    dotColor: 'bg-slate-400',
    headerBg: 'border-slate-700/60',
  },
  Applied: {
    label: 'Applied',
    dotColor: 'bg-blue-400',
    headerBg: 'border-blue-700/60',
  },
  Interview: {
    label: 'Interview',
    dotColor: 'bg-amber-400',
    headerBg: 'border-amber-700/60',
  },
  Offer: {
    label: 'Offer',
    dotColor: 'bg-emerald-400',
    headerBg: 'border-emerald-700/60',
  },
  Rejected: {
    label: 'Rejected',
    dotColor: 'bg-rose-400',
    headerBg: 'border-rose-700/60',
  },
};

export function KanbanColumn({
  status,
  applications,
  onEdit,
  onDelete,
  onStatusChange,
  onAddNew,
}: KanbanColumnProps) {
  const config = COLUMN_CONFIG[status];

  return (
    <div className="bg-navy-950/60 border border-slate-800/80 rounded-xl flex flex-col min-w-[280px] max-w-sm flex-1 overflow-hidden">
      {/* Column Header */}
      <div className={`p-3.5 border-b ${config.headerBg} flex items-center justify-between bg-navy-900/60`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
            {config.label}
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
            {applications.length}
          </span>
        </div>

        <button
          onClick={() => onAddNew(status)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={`Add ${status} application`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Scrollable Container */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[420px] max-h-[70vh]">
        {applications.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-slate-800/80 rounded-lg text-slate-600 text-xs">
            No applications in {status.toLowerCase()}
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
