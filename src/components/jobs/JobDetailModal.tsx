'use client';

import { X, ExternalLink, Bookmark, BookmarkCheck, Calendar, MapPin, Building2, DollarSign, PlusCircle } from 'lucide-react';
import { Job } from '@/lib/types';
import { formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
  onTrackJob?: (job: Job) => void;
}

export function JobDetailModal({
  job,
  isOpen,
  onClose,
  isSaved = false,
  onToggleSave,
  onTrackJob,
}: JobDetailModalProps) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-navy-950/50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg shrink-0 overflow-hidden">
              {job.companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                job.companyName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-cyan-400">{job.companyName}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                  via {job.source}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">{timeAgo(job.publishedAt)}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 leading-snug">
                {job.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Badges */}
        <div className="px-6 py-3 bg-navy-900/90 border-b border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{job.location}</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize">{job.jobType}</span>
          </div>
          {job.salary && (
            <>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{job.salary}</span>
              </div>
            </>
          )}
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Posted: {formatDate(job.publishedAt)}</span>
          </div>
        </div>

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="px-6 py-2.5 bg-navy-950/30 border-b border-slate-800/60 flex flex-wrap gap-1.5">
            {job.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-sm leading-relaxed">
          {job.descriptionHtml ? (
            <div
              className="job-prose"
              dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
            />
          ) : (
            <p className="text-slate-400 italic">No detailed description provided by source.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-navy-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(job)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  isSaved
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-amber-400" />
                    <span>Saved in Bookmarks</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    <span>Save Job</span>
                  </>
                )}
              </button>
            )}

            {onTrackJob && (
              <button
                onClick={() => {
                  onTrackJob(job);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/80 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>Track Application</span>
              </button>
            )}

            {job.salary && (
              <Link
                href={`/salary-calculator?amount=${encodeURIComponent(job.salary.replace(/[^0-9]/g, '') || '80000')}`}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Convert Salary Currency →
              </Link>
            )}
          </div>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
          >
            <span>Apply on {job.source === 'remotive' ? 'Remotive' : 'Arbeitnow'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
