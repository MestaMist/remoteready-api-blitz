'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Globe2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Building,
  Sparkles,
} from 'lucide-react';
import { POPULAR_COUNTRIES } from '@/lib/api/nager';
import { PublicHoliday, CountryOption } from '@/lib/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function PlannerPage() {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>(POPULAR_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const [holidaysError, setHolidaysError] = useState<string | null>(null);

  // Clash Auditor state
  const [testDate, setTestDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [auditResult, setAuditResult] = useState<{
    isWeekend: boolean;
    isHoliday: boolean;
    holidayName?: string;
    recommendedDate: string;
    warningMessage?: string;
  } | null>(null);

  // Load holidays whenever country or year changes
  useEffect(() => {
    async function loadHolidays() {
      setLoading(true);
      setHolidaysError(null);
      try {
        const res = await fetch(`/api/holidays?country=${selectedCountry}&year=${selectedYear}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.holidays)) {
          setHolidays(data.holidays);
          setHolidaysError(null);
        } else {
          setHolidaysError(data.error || 'Nager.Date public holidays service is currently unavailable');
          setHolidays([]);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Network error loading public holidays';
        setHolidaysError(msg);
        setHolidays([]);
        console.error('Failed to load holidays:', e);
      } finally {
        setLoading(false);
      }
    }
    loadHolidays();
  }, [selectedCountry, selectedYear]);

  // Load available countries list
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch('/api/holidays?action=countries');
        const data = await res.json();
        if (data.success && Array.isArray(data.countries)) {
          setCountries(data.countries);
        }
      } catch (e) {
        console.warn('Failed to load countries list, using popular list');
      }
    }
    loadCountries();
  }, []);

  // Run clash audit on testDate
  useEffect(() => {
    async function runAudit() {
      if (!testDate) return;
      try {
        const res = await fetch(
          `/api/holidays?action=check&date=${testDate}&country=${selectedCountry}&year=${selectedYear}`
        );
        const data = await res.json();
        if (data.success && data.analysis) {
          setAuditResult(data.analysis);
        }
      } catch (e) {
        console.warn('Failed to audit date:', e);
      }
    }
    runAudit();
  }, [testDate, selectedCountry, selectedYear]);

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100">Application Follow-Up Planner</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800/40">
            Nager.Date API
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Never send critical follow-ups on national holidays or weekends. Audit international recruiter schedules.
        </p>
      </div>

      {/* Country and Year Selector Bar */}
      <div className="bg-navy-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-medium">Employer Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.name} ({c.countryCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          <strong className="text-cyan-400">{holidays.length}</strong> public holidays verified
        </div>
      </div>

      {/* Date Clash Auditor Interactive Tool */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">
            Interactive Follow-Up Date Clash Auditor
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select your target follow-up date below. RemoteReady cross-references official statutory holidays in{' '}
          <strong className="text-slate-200">
            {countries.find((c) => c.countryCode === selectedCountry)?.name || selectedCountry}
          </strong>{' '}
          and highlights office closures:
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Test Follow-Up Date
            </label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {auditResult && (
            <div className="flex-1 pt-1 sm:pt-4">
              {auditResult.isHoliday || auditResult.isWeekend ? (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Clash Detected! {auditResult.warningMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>Optimal Next Business Day:</span>
                    <button
                      onClick={() => setTestDate(auditResult.recommendedDate)}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono hover:bg-cyan-500/30 transition-colors"
                    >
                      {auditResult.recommendedDate} (Apply)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">
                    Safe Business Day! No official holidays or weekend clashes detected for {testDate} in{' '}
                    {selectedCountry}.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Holiday Timeline Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-400" />
          <span>
            {selectedYear} Public Holidays in{' '}
            {countries.find((c) => c.countryCode === selectedCountry)?.name || selectedCountry}
          </span>
        </h2>

        {loading ? (
          <LoadingSpinner label={`Fetching official holidays from Nager.Date API for ${selectedCountry}...`} />
        ) : holidays.length === 0 ? (
          <div className="text-center py-10 bg-navy-900 border border-slate-800 rounded-xl text-slate-400 text-xs space-y-2">
            <p>{holidaysError || 'No public holidays reported for this region.'}</p>
            {holidaysError && (
              <p className="text-[11px] text-slate-500">
                Official holiday dates are never fabricated. Check your network connection or try switching countries.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {holidays.map((h, idx) => {
              const isPast = new Date(h.date) < new Date();
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isPast
                      ? 'bg-navy-950/40 border-slate-800/60 opacity-60'
                      : 'bg-navy-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-purple-400 font-semibold">{h.date}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                      {h.types?.[0] || 'Public'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 mt-1">{h.name}</h3>
                  {h.localName && h.localName !== h.name && (
                    <p className="text-xs text-slate-400 italic mt-0.5">{h.localName}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Best Practices Advice Card */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Remote Job Application Timing Strategy</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-400">
          <li>
            <strong>Tuesday to Thursday:</strong> Statistically yield 40% higher open and response rates from hiring managers than Friday afternoons or Mondays.
          </li>
          <li>
            <strong>Bank Holiday Spillover:</strong> If Monday is a holiday, treat Tuesday like a catch-up day for recruiters and follow up on Wednesday morning.
          </li>
          <li>
            <strong>Timezone Alignment:</strong> Match 9:00 AM in the hiring team&apos;s primary headquarters to land at the top of their morning inbox.
          </li>
        </ul>
      </div>
    </div>
  );
}
