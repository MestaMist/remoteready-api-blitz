export type JobSource = 'remotive' | 'arbeitnow';

export interface Job {
  id: string;
  source: JobSource;
  title: string;
  companyName: string;
  companyLogo?: string;
  category?: string;
  tags: string[];
  jobType: string;
  location: string;
  salary?: string;
  url: string;
  publishedAt: string;
  descriptionHtml: string;
  isRemote: boolean;
}

export type ApplicationStatus = 'Interested' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Application {
  id: string;
  job_id?: string | null;
  company_name: string;
  role_title: string;
  status: ApplicationStatus;
  application_date?: string;
  follow_up_date?: string | null;
  salary?: string | null;
  currency: string;
  job_url?: string | null;
  source?: string;
  notes?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SavedJob {
  id: string;
  job_id: string;
  title: string;
  company_name: string;
  source: string;
  job_url: string;
  location?: string | null;
  salary?: string | null;
  category?: string | null;
  tags: string[];
  published_at?: string | null;
  created_at?: string;
}

export interface ExchangeRatesResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface PublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
}

export interface CountryOption {
  countryCode: string;
  name: string;
}

export interface HackerNewsStory {
  id: number;
  title: string;
  by: string;
  score: number;
  descendants: number;
  time: number;
  url?: string;
  hnUrl: string;
  category: 'hiring' | 'ai' | 'tech' | 'career' | 'general';
}

export interface DatabaseStatus {
  connected: boolean;
  message: string;
  tables?: {
    applications: boolean;
    saved_jobs: boolean;
    user_preferences: boolean;
  };
  counts?: {
    applications: number;
    saved_jobs: number;
  };
}
