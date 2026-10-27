'use client';

import { Building2, Calendar, MapPin, DollarSign, ExternalLink, MoreVertical, Pencil, Trash2, Clock } from 'lucide-react';
import { Application, ApplicationStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface ApplicationCardProps {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Interested',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
];

export function ApplicationCard({
  app,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Check if follow up date is past or today
  const isFollowUpDue = (() => {
    if (!app.follow_up_date) return false;
    const target = new Date(app.follow_up_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return target <= today;
  })();

  return (
    <div className="bg-navy-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-cyan-400">{app.company_name}</p>
            <h4 className="text-sm font-semibold text-slate-100 mt-0.5 line-clamp-1">{app.role_title}</h4>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-1 w-32 bg-navy-950 border border-slate-700 rounded-lg shadow-xl z-20 py-1 text-xs"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(app);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(app.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {app.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{app.location}</span>
            </div>
          )}
          {app.salary && (
            <div className="flex items-center gap-1 text-emerald-400 font-mono">
              <DollarSign className="w-3 h-3" />
              <span>{app.salary} {app.currency}</span>
            </div>
          )}
        </div>

        {app.notes && (
          <p className="mt-2 text-xs text-slate-400 bg-slate-950/40 rounded p-2 border border-slate-800/60 line-clamp-2">
            {app.notes}
          </p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        {app.follow_up_date ? (
          <div
            className={`flex items-center gap-1 text-[11px] font-mono ${
              isFollowUpDue ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
            title={`Follow-up date: ${app.follow_up_date}`}
          >
            <Clock className="w-3 h-3" />
            <span>Follow-up: {formatDate(app.follow_up_date)}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">
            Applied: {formatDate(app.application_date)}
          </span>
        )}

        <div className="flex items-center gap-2">
          {app.job_url && (
            <a
              href={app.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-400"
              title="Open job link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <select
            value={app.status}
            onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
            className="text-[11px] bg-slate-800/80 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
