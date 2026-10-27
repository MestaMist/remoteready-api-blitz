'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calculator,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { POPULAR_CURRENCIES, convertSalary } from '@/lib/api/frankfurter';
import { ExchangeRatesResponse } from '@/lib/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function SalaryCalculatorContent() {
  const searchParams = useSearchParams();
  const initialAmount = searchParams.get('amount') || '85000';

  const [amount, setAmount] = useState<number>(Number(initialAmount) || 85000);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [frequency, setFrequency] = useState<'annual' | 'monthly' | 'hourly'>('annual');

  const [ratesData, setRatesData] = useState<ExchangeRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const fetchRates = async (base = 'USD') => {
    setRatesError(null);
    try {
      const res = await fetch(`/api/rates?base=${base}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRatesData(json.data);
      } else {
        setRatesError(json.error || 'Failed to fetch live exchange rates from Frankfurter');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error loading exchange rates';
      setRatesError(msg);
      console.error('Failed to load rates:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates(fromCurrency);
  }, [fromCurrency]);

  const swapCurrencies = () => {
    const prevFrom = fromCurrency;
    const prevTo = toCurrency;
    setFromCurrency(prevTo);
    setToCurrency(prevFrom);
  };

  // Convert main amount
  const conversionResult = useMemo(() => {
    if (!ratesData || !ratesData.rates) return { converted: amount, rateUsed: 1 };
    return convertSalary(amount, fromCurrency, toCurrency, ratesData.rates, ratesData.base);
  }, [amount, fromCurrency, toCurrency, ratesData]);

  // Frequency adjustments
  const frequencyMultipliers = {
    annual: { divisor: 1, label: 'Annual Salary' },
    monthly: { divisor: 12, label: 'Monthly Compensation' },
    hourly: { divisor: 2080, label: 'Hourly Rate (40h/wk)' },
  };

  const currentAnnual = frequency === 'annual' ? amount : frequency === 'monthly' ? amount * 12 : amount * 2080;
  const currentAnnualConverted =
    frequency === 'annual'
      ? conversionResult.converted
      : frequency === 'monthly'
      ? conversionResult.converted * 12
      : conversionResult.converted * 2080;

  // Multi-currency comparison matrix
  const matrixCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD', 'CHF'];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100">Global Salary Conversion Calculator</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            Frankfurter API Rates
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Accurate currency conversions for international remote roles and contractor rate planning.
        </p>
      </div>

      {/* Main Conversion Card */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg">
        {loading ? (
          <LoadingSpinner label="Fetching live European Central Bank rates from Frankfurter..." />
        ) : ratesError && !ratesData ? (
          <div className="py-8 text-center space-y-3">
            <div className="inline-flex p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Frankfurter Exchange Rates Unavailable</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {ratesError}. As per hackathon compensation accuracy guidelines, exchange rates are never fabricated. Please retry to connect to the live rate feed.
            </p>
            <button
              onClick={() => fetchRates(fromCurrency)}
              className="px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold"
            >
              Retry Live Rate Feed
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Input & Currencies Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Amount Input */}
              <div className="lg:col-span-5 space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Remuneration Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    {POPULAR_CURRENCIES.find((c) => c.code === fromCurrency)?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* From Currency */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Source Currency
                </label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-1 flex justify-center pt-5">
                <button
                  type="button"
                  onClick={swapCurrencies}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Swap currencies"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* To Currency */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Target Currency
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pay Frequency Switcher */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium">Frequency:</span>
              <div className="inline-flex p-1 bg-slate-950 rounded-lg border border-slate-800">
                {(['annual', 'monthly', 'hourly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setFrequency(freq)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                      frequency === freq
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>

              <span className="ml-auto text-[11px] text-slate-500 font-mono hidden sm:inline-block">
                Exchange rates as of {ratesData?.date || 'Today'}
              </span>
            </div>

            {/* Primary Conversion Output Display */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-navy-950 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {amount.toLocaleString()} {fromCurrency} ({frequency}) converts to:
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono tracking-tight">
                    {conversionResult.converted.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xl font-bold text-slate-200 font-mono">{toCurrency}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  Effective Rate: 1 {fromCurrency} = {conversionResult.rateUsed.toFixed(4)} {toCurrency}
                </p>
              </div>

              {/* Equivalent Breakdowns */}
              <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Annual</span>
                  <p className="font-semibold text-slate-200 font-mono">
                    {Math.round(currentAnnualConverted).toLocaleString()} {toCurrency}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Monthly</span>
                  <p className="font-semibold text-slate-200 font-mono">
                    {Math.round(currentAnnualConverted / 12).toLocaleString()} {toCurrency}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Hourly</span>
                  <p className="font-semibold text-slate-200 font-mono">
                    {(currentAnnualConverted / 2080).toFixed(2)} {toCurrency}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Currency Matrix */}
      {ratesData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Multi-Currency Benchmark Matrix</span>
            </h2>
            <span className="text-xs text-slate-400">
              Comparing {amount.toLocaleString()} {fromCurrency} across primary developer regions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {matrixCurrencies.map((cur) => {
              const res = convertSalary(amount, fromCurrency, cur, ratesData.rates, ratesData.base);
              const info = POPULAR_CURRENCIES.find((c) => c.code === cur);
              return (
                <div
                  key={cur}
                  className={`p-4 rounded-xl border transition-all ${
                    cur === toCurrency
                      ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                      : 'bg-navy-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200">{cur}</span>
                    <span className="text-[11px] font-mono text-slate-500">{info?.symbol}</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-white mt-1">
                    {Math.round(res.converted).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    1 {fromCurrency} = {res.rateUsed.toFixed(2)} {cur}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required Hackathon Disclaimer Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-300">Currency & Compensation Integrity Notice</p>
          <p className="text-[11px] leading-relaxed">
            All exchange rates are fetched live from the official <strong className="text-slate-300">Frankfurter API</strong> (tracking European Central Bank published benchmarks). Conversions are provided solely for financial reference and developer salary evaluation. An estimated conversion does not represent an employer&apos;s stated or legally binding compensation. Always verify local tax obligations, contractor agreements, and employer terms directly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SalaryCalculatorPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading Salary Calculator..." />}>
      <SalaryCalculatorContent />
    </Suspense>
  );
}
