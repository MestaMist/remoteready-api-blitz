'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle, DollarSign, Building2, Briefcase, Link2 } from 'lucide-react';
import { Application, ApplicationStatus } from '@/lib/types';
import { POPULAR_CURRENCIES } from '@/lib/api/frankfurter';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: Partial<Application>) => Promise<void>;
  initialData?: Application | null;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Interested',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
];

export function ApplicationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ApplicationModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [followUpDate, setFollowUpDate] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [jobUrl, setJobUrl] = useState('');
  const [location, setLocation] = useState('Remote');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Date clash check state via Nager.Date
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.company_name || '');
      setRoleTitle(initialData.role_title || '');
      setStatus(initialData.status || 'Applied');
      setApplicationDate(initialData.application_date || new Date().toISOString().split('T')[0]);
      setFollowUpDate(initialData.follow_up_date || '');
      setSalary(initialData.salary || '');
      setCurrency(initialData.currency || 'USD');
      setJobUrl(initialData.job_url || '');
      setLocation(initialData.location || 'Remote');
      setNotes(initialData.notes || '');
    } else {
      setCompanyName('');
      setRoleTitle('');
      setStatus('Applied');
      setApplicationDate(new Date().toISOString().split('T')[0]);
      // Default follow-up date is 7 days from now
      const defaultFollowUp = new Date();
      defaultFollowUp.setDate(defaultFollowUp.getDate() + 7);
      setFollowUpDate(defaultFollowUp.toISOString().split('T')[0]);
      setSalary('');
      setCurrency('USD');
      setJobUrl('');
      setLocation('Remote');
      setNotes('');
    }
  }, [initialData, isOpen]);

  // Check followUpDate using Nager.Date clash endpoint
  useEffect(() => {
    if (!followUpDate) {
      setDateWarning(null);
      setSuggestedDate(null);
      return;
    }

    const checkDate = async () => {
      try {
        const res = await fetch(`/api/holidays?action=check&date=${followUpDate}&country=US`);
        const data = await res.json();
        if (data.success && data.analysis) {
          if (data.analysis.isWeekend || data.analysis.isHoliday) {
            setDateWarning(data.analysis.warningMessage);
            setSuggestedDate(data.analysis.recommendedDate);
          } else {
            setDateWarning(null);
            setSuggestedDate(null);
          }
        }
      } catch (e) {
        // Silent catch for clash check
      }
    };

    checkDate();
  }, [followUpDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleTitle.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        company_name: companyName.trim(),
        role_title: roleTitle.trim(),
        status,
        application_date: applicationDate,
        follow_up_date: followUpDate || null,
        salary: salary.trim() || null,
        currency,
        job_url: jobUrl.trim() || null,
        location: location.trim() || 'Remote',
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="p-5 border-b border-slate-800 bg-navy-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100">
              {initialData ? 'Edit Application' : 'Track New Application'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, GitHub, Vercel"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Full-Stack Engineer"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Application Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Location / Remote</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote / US / Worldwide"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Application Date</label>
              <input
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Follow-up Target Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Date Clash Warning Banner powered by Nager.Date */}
          {dateWarning && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{dateWarning}</p>
                {suggestedDate && (
                  <p className="mt-1 text-slate-300">
                    Recommended safe business day:{' '}
                    <button
                      type="button"
                      onClick={() => setFollowUpDate(suggestedDate)}
                      className="font-mono text-cyan-400 underline ml-1"
                    >
                      {suggestedDate} (Click to apply)
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Salary / Range</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 95000 or 90k-110k"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Job Link / Source URL</label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notes & Follow-up Plans</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reached out via referral, interviewed with tech lead on Tuesday..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialData ? 'Update Application' : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
