'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  KanbanSquare,
  Calculator,
  Radio,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  Globe,
  Sparkles,
  ExternalLink,
  DollarSign,
  Bookmark,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { JobCard } from '@/components/jobs/JobCard';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Job, HackerNewsStory, PublicHoliday } from '@/lib/types';
import { timeAgo, formatCurrency } from '@/lib/utils';

export default function OverviewPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [news, setNews] = useState<HackerNewsStory[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [appCount, setAppCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [holidaysError, setHolidaysError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [jobsRes, newsRes, holidaysRes, appsRes] = await Promise.allSettled([
          fetch('/api/jobs?sort=newest').then((r) => r.json()),
          fetch('/api/news?limit=5').then((r) => r.json()),
          fetch('/api/holidays?country=US&year=2026').then((r) => r.json()),
          fetch('/api/applications').then((r) => r.json()),
        ]);

        if (jobsRes.status === 'fulfilled' && jobsRes.value?.jobs) {
          setJobs(jobsRes.value.jobs.slice(0, 6));
        }

        if (newsRes.status === 'fulfilled' && newsRes.value?.stories) {
          setNews(newsRes.value.stories.slice(0, 5));
        } else {
          setNewsError('Hacker News API temporarily unreachable');
        }

        if (holidaysRes.status === 'fulfilled' && holidaysRes.value?.holidays) {
          // Find next 3 upcoming holidays
          const today = new Date().toISOString().split('T')[0];
          const upcoming = holidaysRes.value.holidays
            .filter((h: PublicHoliday) => h.date >= today)
            .slice(0, 3);
          setHolidays(upcoming);
        } else {
          setHolidaysError('Nager.Date public holidays service temporarily unreachable');
        }

        if (appsRes.status === 'fulfilled' && appsRes.value?.applications) {
          setAppCount(appsRes.value.applications.length);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const toggleSaveJob = async (job: Job) => {
    const isSaved = savedJobIds.has(job.id);
    const nextSaved = new Set(savedJobIds);

    if (isSaved) {
      nextSaved.delete(job.id);
      setSavedJobIds(nextSaved);
      try {
        await fetch(`/api/saved-jobs/${encodeURIComponent(job.id)}`, { method: 'DELETE' });
      } catch (e) {
        console.error(e);
      }
    } else {
      nextSaved.add(job.id);
      setSavedJobIds(nextSaved);
      try {
        await fetch('/api/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            title: job.title,
            company_name: job.companyName,
            source: job.source,
            job_url: job.url,
            location: job.location,
            salary: job.salary || null,
            category: job.category || null,
            tags: job.tags,
            published_at: job.publishedAt,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Remote Career OS • 5 Live API Feeds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover Global Remote Roles, Benchmark Salaries & Plan Applications.
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            RemoteReady unifies live remote opportunities from Remotive and Arbeitnow, real-time exchange rates via Frankfurter, international public holidays from Nager.Date, and tech radar discussions from Hacker News.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>Explore Remote Jobs</span>
            </Link>

            <Link
              href="/salary-calculator"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Convert Salary (USD / EUR / INR)</span>
            </Link>

            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-medium transition-colors"
            >
              <KanbanSquare className="w-4 h-4 text-blue-400" />
              <span>Open Application Tracker</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Remote Roles Indexed"
          value={jobs.length > 0 ? '100+' : 'Syncing'}
          subtitle="Remotive & Arbeitnow feeds"
          badge="Live Feed"
          icon={Globe}
          colorScheme="cyan"
        />
        <StatCard
          title="Tracked Applications"
          value={appCount}
          subtitle="Persistent in Neon Postgres"
          badge="Kanban Board"
          icon={KanbanSquare}
          colorScheme="blue"
        />
        <StatCard
          title="Live FX Benchmarks"
          value="1.00 USD"
          subtitle="~86.50 INR • 0.92 EUR • 0.79 GBP"
          badge="Frankfurter API"
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <StatCard
          title="Holiday Intelligence"
          value="2026 Active"
          subtitle="Nager.Date date conflict audit"
          badge="Calendar Sync"
          icon={CalendarDays}
          colorScheme="purple"
        />
      </div>

      {/* Main Grid: Recent Jobs & Tech Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Jobs (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">Featured Remote Opportunities</h2>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              <span>View all jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner label="Fetching unified remote jobs..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.has(job.id)}
                  onToggleSave={toggleSaveJob}
                  onSelectJob={setSelectedJob}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Tech Radar & Planner Snapshot */}
        <div className="space-y-6">
          {/* Hacker News Tech Radar Snapshot */}
          <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-sm text-slate-100">Hacker News Radar</h3>
              </div>
              <Link href="/tech-radar" className="text-[11px] text-cyan-400 hover:underline">
                Explore all
              </Link>
            </div>

            <div className="space-y-3">
              {news.length === 0 ? (
                <div className="text-xs text-slate-500 py-3">
                  {newsError ? (
                    <span className="text-amber-400/90 font-mono text-[11px]">{newsError}</span>
                  ) : (
                    'Connecting to Hacker News API...'
                  )}
                </div>
              ) : (
                news.map((story) => (
                  <div key={story.id} className="group text-xs space-y-1">
                    <a
                      href={story.url || story.hnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-300 hover:text-cyan-300 transition-colors line-clamp-2 block leading-snug"
                    >
                      {story.title}
                    </a>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>{story.score} pts</span>
                      <span>•</span>
                      <span>{story.descendants} comments</span>
                      <span>•</span>
                      <span>{timeAgo(story.time)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Public Holidays Box */}
          <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-sm text-slate-100">Upcoming Holidays (US)</h3>
              </div>
              <Link href="/planner" className="text-[11px] text-purple-400 hover:underline">
                View Planner
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              Check dates before sending interview follow-ups:
            </p>
            <div className="space-y-2">
              {holidays.length === 0 ? (
                <div className="text-xs text-slate-500">
                  {holidaysError ? (
                    <span className="text-amber-400/90 font-mono text-[11px]">{holidaysError}</span>
                  ) : (
                    'Checking Nager.Date API...'
                  )}
                </div>
              ) : (
                holidays.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-xs"
                  >
                    <span className="font-medium text-slate-200">{h.name}</span>
                    <span className="font-mono text-purple-300 text-[11px]">{h.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        isSaved={selectedJob ? savedJobIds.has(selectedJob.id) : false}
        onToggleSave={toggleSaveJob}
      />
    </div>
  );
}
