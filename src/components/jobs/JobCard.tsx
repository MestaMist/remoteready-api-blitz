'use client';

import { Building2, MapPin, DollarSign, ExternalLink, Bookmark, BookmarkCheck, ArrowUpRight, PlusCircle } from 'lucide-react';
import { Job } from '@/lib/types';
import { timeAgo, truncate } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
  onSelectJob?: (job: Job) => void;
  onTrackJob?: (job: Job) => void;
}

export function JobCard({
  job,
  isSaved = false,
  onToggleSave,
  onSelectJob,
  onTrackJob,
}: JobCardProps) {
  return (
    <div className="group bg-navy-900/70 hover:bg-navy-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0 overflow-hidden">
              {job.companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                job.companyName.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-cyan-400/90">{job.companyName}</p>
              <h3
                onClick={() => onSelectJob?.(job)}
                className="text-base font-semibold text-slate-100 hover:text-cyan-300 cursor-pointer transition-colors mt-0.5 line-clamp-1"
                title={job.title}
              >
                {job.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(job)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSaved
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border-transparent hover:border-slate-700'
                }`}
                title={isSaved ? 'Saved in bookmarks' : 'Save to bookmarks'}
                aria-label="Bookmark job"
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                job.source === 'remotive'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                  : 'bg-purple-950/60 text-purple-300 border-purple-800/50'
              }`}
            >
              {job.source}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="line-clamp-1">{job.location}</span>
          </div>
          <span className="text-slate-700">•</span>
          <span className="capitalize">{job.jobType}</span>
          {job.salary && (
            <>
              <span className="text-slate-700">•</span>
              <span className="text-emerald-400 font-mono flex items-center gap-0.5 font-medium">
                <DollarSign className="w-3 h-3" />
                {job.salary}
              </span>
            </>
          )}
        </div>

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/40"
              >
                {tag}
              </span>
            ))}
            {job.tags.length > 3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 text-slate-500">
                +{job.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500 font-mono">
          {timeAgo(job.publishedAt)}
        </span>

        <div className="flex items-center gap-2">
          {onTrackJob && (
            <button
              onClick={() => onTrackJob(job)}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Add to Application Tracker"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onSelectJob?.(job)}
            className="px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium text-xs"
          >
            Details
          </button>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-colors"
          >
            <span>Source</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
