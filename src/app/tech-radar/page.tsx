'use client';

import { useState, useEffect } from 'react';
import {
  Radio,
  ExternalLink,
  MessageSquare,
  Flame,
  Clock,
  User,
  Filter,
  RefreshCw,
  Sparkles,
  Briefcase,
  Cpu,
  Code2,
} from 'lucide-react';
import { HackerNewsStory } from '@/lib/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { timeAgo } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'All Stories', icon: Radio },
  { id: 'hiring', label: 'Hiring & Jobs', icon: Briefcase },
  { id: 'ai', label: 'AI & Models', icon: Cpu },
  { id: 'tech', label: 'Tech & Stack', icon: Code2 },
  { id: 'career', label: 'Career & Industry', icon: Flame },
];

export default function TechRadarPage() {
  const [stories, setStories] = useState<HackerNewsStory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (cat = 'all') => {
    try {
      const url = cat === 'all' ? '/api/news?limit=35' : `/api/news?category=${cat}&limit=35`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.stories)) {
        setStories(data.stories);
      }
    } catch (e) {
      console.error('Failed to load Hacker News stories:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews(selectedCategory);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Developer Technology Radar</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              Official Hacker News API
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time developer discussions, breakthrough technologies, and hiring announcements from the tech community.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Radar'}</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'bg-navy-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stories List */}
      {loading ? (
        <LoadingSpinner label="Fetching live discussions from Hacker News Firebase API..." />
      ) : stories.length === 0 ? (
        <EmptyState
          title="No Stories Found"
          description="Could not find stories in this category right now. Try switching to 'All Stories'."
          icon={Radio}
          actionLabel="View All Stories"
          onAction={() => setSelectedCategory('all')}
        />
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-navy-900/80 hover:bg-navy-900 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${
                      story.category === 'hiring'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                        : story.category === 'ai'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                        : story.category === 'tech'
                        ? 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/50'
                    }`}
                  >
                    {story.category}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-slate-500" />
                    {story.by}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {timeAgo(story.time)}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                  <a
                    href={story.url || story.hnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {story.title}
                  </a>
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    {story.score} points
                  </span>
                  <span>•</span>
                  <a
                    href={story.hnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    {story.descendants} comments
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                {story.url && (
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-medium transition-colors"
                  >
                    <span>Read Story</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <a
                  href={story.hnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  <span>HN Thread</span>
                  <MessageSquare className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
