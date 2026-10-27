'use client';

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Bookmark, AlertCircle, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { ApplicationModal } from '@/components/tracker/ApplicationModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Job, Application, SavedJob } from '@/lib/types';

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerHealth, setProviderHealth] = useState<{
    remotive?: { status: string; count: number; error?: string };
    arbeitnow?: { status: string; count: number; error?: string };
  }>({});

  // Filters state
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [sort, setSort] = useState('newest');

  // Modal states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [trackJobModal, setTrackJobModal] = useState<Job | null>(null);

  // Fetch jobs from unified route
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (source !== 'all') params.set('source', source);
      if (jobType !== 'all') params.set('type', jobType);
      if (sort !== 'newest') params.set('sort', sort);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      setJobs(data.jobs || []);
      if (data.providers) {
        setProviderHealth(data.providers);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching remote jobs';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, source, jobType, sort]);

  // Load saved jobs on mount
  const fetchSavedJobs = async () => {
    try {
      const res = await fetch('/api/saved-jobs');
      const data = await res.json();
      if (data.success && Array.isArray(data.savedJobs)) {
        setSavedJobs(data.savedJobs);
        setSavedIds(new Set(data.savedJobs.map((j: SavedJob) => j.job_id)));
      }
    } catch (e) {
      console.warn('Failed to load saved jobs:', e);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
  }, [fetchJobs]);

  const toggleSaveJob = async (job: Job) => {
    const isSaved = savedIds.has(job.id);
    const nextSavedIds = new Set(savedIds);

    if (isSaved) {
      nextSavedIds.delete(job.id);
      setSavedIds(nextSavedIds);
      setSavedJobs((prev) => prev.filter((j) => j.job_id !== job.id));

      try {
        await fetch(`/api/saved-jobs/${encodeURIComponent(job.id)}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to remove bookmark:', e);
      }
    } else {
      nextSavedIds.add(job.id);
      setSavedIds(nextSavedIds);

      const newSavedRecord: SavedJob = {
        id: `save_${Date.now()}`,
        job_id: job.id,
        title: job.title,
        company_name: job.companyName,
        source: job.source,
        job_url: job.url,
        location: job.location,
        salary: job.salary,
        category: job.category,
        tags: job.tags,
        published_at: job.publishedAt,
        created_at: new Date().toISOString(),
      };
      setSavedJobs((prev) => [newSavedRecord, ...prev]);

      try {
        await fetch('/api/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSavedRecord),
        });
      } catch (e) {
        console.error('Failed to save bookmark:', e);
      }
    }
  };

  const handleSaveApplication = async (appData: Partial<Application>) => {
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      });
      setTrackJobModal(null);
    } catch (e) {
      console.error('Failed to save application:', e);
    }
  };

  // Convert saved job record to full Job interface for card rendering
  const mappedSavedJobs: Job[] = savedJobs.map((s) => ({
    id: s.job_id,
    source: s.source as 'remotive' | 'arbeitnow',
    title: s.title,
    companyName: s.company_name,
    category: s.category || undefined,
    tags: s.tags || [],
    jobType: 'Full-Time',
    location: s.location || 'Remote',
    salary: s.salary || undefined,
    url: s.job_url,
    publishedAt: s.published_at || s.created_at || new Date().toISOString(),
    descriptionHtml: '',
    isRemote: true,
  }));

  const displayJobs = activeTab === 'all' ? jobs : mappedSavedJobs;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Unified Remote Job Feed</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              Remotive + Arbeitnow
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated, deduplicated, and normalized live remote jobs for students, freshers, and engineers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-navy-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>All Jobs ({jobs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'saved'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarked ({savedJobs.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Component */}
      {activeTab === 'all' && (
        <>
          <JobFilters
            search={search}
            onSearchChange={setSearch}
            source={source}
            onSourceChange={setSource}
            jobType={jobType}
            onJobTypeChange={setJobType}
            sort={sort}
            onSortChange={setSort}
            totalResults={jobs.length}
          />

          {/* Provider Specific Health Notices */}
          {providerHealth.remotive?.status === 'unavailable' && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Remotive API Notice:</strong> Remotive is currently unreachable ({providerHealth.remotive.error || 'timeout'}). Displaying verified listings from Arbeitnow.
                </span>
              </div>
              <button onClick={() => fetchJobs()} className="underline text-amber-300 font-mono text-[11px] shrink-0">
                Retry Remotive
              </button>
            </div>
          )}

          {providerHealth.arbeitnow?.status === 'unavailable' && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Arbeitnow API Notice:</strong> Arbeitnow is currently unreachable ({providerHealth.arbeitnow.error || 'timeout'}). Displaying verified listings from Remotive.
                </span>
              </div>
              <button onClick={() => fetchJobs()} className="underline text-amber-300 font-mono text-[11px] shrink-0">
                Retry Arbeitnow
              </button>
            </div>
          )}
        </>
      )}

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner label="Querying Remotive and Arbeitnow APIs in parallel..." />
      ) : error ? (
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-6 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-semibold text-rose-300">Feed Connection Issue</h3>
          <p className="text-xs text-rose-200/80">{error}</p>
          <button
            onClick={() => fetchJobs()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Feed</span>
          </button>
        </div>
      ) : displayJobs.length === 0 ? (
        <EmptyState
          title={activeTab === 'saved' ? 'No Bookmarked Jobs' : 'No Jobs Found'}
          description={
            activeTab === 'saved'
              ? 'Click the bookmark icon on any job card to save it for later review.'
              : 'Try broadening your search keywords or switching source filters.'
          }
          icon={activeTab === 'saved' ? Bookmark : Briefcase}
          actionLabel={activeTab === 'saved' ? 'Browse All Jobs' : 'Reset Search'}
          onAction={activeTab === 'saved' ? () => setActiveTab('all') : () => setSearch('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedIds.has(job.id)}
              onToggleSave={toggleSaveJob}
              onSelectJob={setSelectedJob}
              onTrackJob={(j) => setTrackJobModal(j)}
            />
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        isSaved={selectedJob ? savedIds.has(selectedJob.id) : false}
        onToggleSave={toggleSaveJob}
        onTrackJob={(j) => setTrackJobModal(j)}
      />

      {/* Quick Application Tracker Modal */}
      {trackJobModal && (
        <ApplicationModal
          isOpen={Boolean(trackJobModal)}
          onClose={() => setTrackJobModal(null)}
          onSave={handleSaveApplication}
          initialData={{
            id: '',
            job_id: trackJobModal.id,
            company_name: trackJobModal.companyName,
            role_title: trackJobModal.title,
            status: 'Interested',
            job_url: trackJobModal.url,
            location: trackJobModal.location,
            salary: trackJobModal.salary || null,
            currency: 'USD',
            source: trackJobModal.source,
          }}
        />
      )}
    </div>
  );
}
