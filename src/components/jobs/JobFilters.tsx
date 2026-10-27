'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';

interface JobFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  jobType: string;
  onJobTypeChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  totalResults: number;
}

export function JobFilters({
  search,
  onSearchChange,
  source,
  onSourceChange,
  jobType,
  onJobTypeChange,
  sort,
  onSortChange,
  totalResults,
}: JobFiltersProps) {
  const hasActiveFilters = search || source !== 'all' || jobType !== 'all' || sort !== 'newest';

  const resetFilters = () => {
    onSearchChange('');
    onSourceChange('all');
    onJobTypeChange('all');
    onSortChange('newest');
  };

  return (
    <div className="bg-navy-900/80 border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by role title, tech stack (React, Python, Go), company, or location..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Source Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Source:</span>
            <select
              value={source}
              onChange={(e) => onSourceChange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Sources (Remotive + Arbeitnow)</option>
              <option value="remotive">Remotive API</option>
              <option value="arbeitnow">Arbeitnow API</option>
            </select>
          </div>

          {/* Job Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Type:</span>
            <select
              value={jobType}
              onChange={(e) => onJobTypeChange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Job Types</option>
              <option value="full-time">Full-Time</option>
              <option value="contract">Contract / Freelance</option>
              <option value="internship">Internship</option>
              <option value="part-time">Part-Time</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="newest">Most Recent</option>
              <option value="company">Company (A-Z)</option>
              <option value="title">Role Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results Count & Reset */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-mono">
            <strong className="text-cyan-400">{totalResults}</strong> jobs available
          </span>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
