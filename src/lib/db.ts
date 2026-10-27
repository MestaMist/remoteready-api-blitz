import { neon } from '@neondatabase/serverless';
import { Application, SavedJob } from './types';

export function getDbUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || url === '' || url.includes('your_password_here')) {
    return null;
  }
  return url;
}

export function isDbConfigured(): boolean {
  return Boolean(getDbUrl());
}

export function getSql() {
  const url = getDbUrl();
  if (!url) {
    throw new Error('DATABASE_URL is not configured. Please add your Neon connection string in .env.local.');
  }
  return neon(url);
}

// Automatically create tables if not present
export async function initDb() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(64) PRIMARY KEY,
      job_id VARCHAR(128),
      company_name VARCHAR(255) NOT NULL,
      role_title VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Interested',
      application_date DATE DEFAULT CURRENT_DATE,
      follow_up_date DATE,
      salary VARCHAR(64),
      currency VARCHAR(10) DEFAULT 'USD',
      job_url TEXT,
      source VARCHAR(64) DEFAULT 'Custom',
      notes TEXT,
      location VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id VARCHAR(64) PRIMARY KEY,
      job_id VARCHAR(128) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      source VARCHAR(64) NOT NULL,
      job_url TEXT NOT NULL,
      location VARCHAR(255),
      salary VARCHAR(128),
      category VARCHAR(128),
      tags JSONB DEFAULT '[]'::jsonb,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id VARCHAR(64) PRIMARY KEY DEFAULT 'default_user',
      preferred_currency VARCHAR(10) DEFAULT 'USD',
      preferred_country VARCHAR(10) DEFAULT 'US',
      target_roles JSONB DEFAULT '["Full-Stack Developer", "Frontend Developer", "Backend Developer"]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

// Applications CRUD
export async function getApplications(): Promise<Application[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, job_id, company_name, role_title, status, 
           TO_CHAR(application_date, 'YYYY-MM-DD') as application_date,
           TO_CHAR(follow_up_date, 'YYYY-MM-DD') as follow_up_date,
           salary, currency, job_url, source, notes, location,
           created_at, updated_at
    FROM applications
    ORDER BY created_at DESC;
  `;
  return rows as unknown as Application[];
}

export async function createApplication(app: Partial<Application>): Promise<Application> {
  const sql = getSql();
  const id = app.id || `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rows = await sql`
    INSERT INTO applications (
      id, job_id, company_name, role_title, status, application_date,
      follow_up_date, salary, currency, job_url, source, notes, location
    ) VALUES (
      ${id},
      ${app.job_id || null},
      ${app.company_name || 'Untitled Company'},
      ${app.role_title || 'Untitled Role'},
      ${app.status || 'Interested'},
      ${app.application_date || new Date().toISOString().split('T')[0]},
      ${app.follow_up_date || null},
      ${app.salary || null},
      ${app.currency || 'USD'},
      ${app.job_url || null},
      ${app.source || 'Custom'},
      ${app.notes || null},
      ${app.location || 'Remote'}
    )
    RETURNING id, job_id, company_name, role_title, status,
              TO_CHAR(application_date, 'YYYY-MM-DD') as application_date,
              TO_CHAR(follow_up_date, 'YYYY-MM-DD') as follow_up_date,
              salary, currency, job_url, source, notes, location,
              created_at, updated_at;
  `;
  return rows[0] as unknown as Application;
}

export async function updateApplication(id: string, updates: Partial<Application>): Promise<Application | null> {
  const sql = getSql();
  const rows = await sql`
    UPDATE applications
    SET 
      company_name = COALESCE(${updates.company_name ?? null}, company_name),
      role_title = COALESCE(${updates.role_title ?? null}, role_title),
      status = COALESCE(${updates.status ?? null}, status),
      application_date = COALESCE(${updates.application_date ?? null}::date, application_date),
      follow_up_date = ${updates.follow_up_date ? updates.follow_up_date : null}::date,
      salary = COALESCE(${updates.salary ?? null}, salary),
      currency = COALESCE(${updates.currency ?? null}, currency),
      job_url = COALESCE(${updates.job_url ?? null}, job_url),
      notes = COALESCE(${updates.notes ?? null}, notes),
      location = COALESCE(${updates.location ?? null}, location),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, job_id, company_name, role_title, status,
              TO_CHAR(application_date, 'YYYY-MM-DD') as application_date,
              TO_CHAR(follow_up_date, 'YYYY-MM-DD') as follow_up_date,
              salary, currency, job_url, source, notes, location,
              created_at, updated_at;
  `;
  return (rows[0] as unknown as Application) || null;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM applications WHERE id = ${id} RETURNING id;
  `;
  return rows.length > 0;
}

// Saved Jobs CRUD
export async function getSavedJobs(): Promise<SavedJob[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, job_id, title, company_name, source, job_url, location, salary, category, tags, published_at, created_at
    FROM saved_jobs
    ORDER BY created_at DESC;
  `;
  return rows as unknown as SavedJob[];
}

export async function saveJob(job: Partial<SavedJob>): Promise<SavedJob> {
  const sql = getSql();
  const id = job.id || `save_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tagsJson = JSON.stringify(job.tags || []);
  
  const rows = await sql`
    INSERT INTO saved_jobs (
      id, job_id, title, company_name, source, job_url, location, salary, category, tags, published_at
    ) VALUES (
      ${id},
      ${job.job_id || id},
      ${job.title || 'Untitled'},
      ${job.company_name || 'Unknown Company'},
      ${job.source || 'remotive'},
      ${job.job_url || ''},
      ${job.location || 'Remote'},
      ${job.salary || null},
      ${job.category || null},
      ${tagsJson}::jsonb,
      ${job.published_at ? new Date(job.published_at).toISOString() : new Date().toISOString()}
    )
    ON CONFLICT (job_id) DO UPDATE 
    SET 
      title = EXCLUDED.title,
      company_name = EXCLUDED.company_name,
      job_url = EXCLUDED.job_url,
      salary = EXCLUDED.salary,
      tags = EXCLUDED.tags
    RETURNING id, job_id, title, company_name, source, job_url, location, salary, category, tags, published_at, created_at;
  `;
  return rows[0] as unknown as SavedJob;
}

export async function removeSavedJob(jobId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM saved_jobs WHERE job_id = ${jobId} OR id = ${jobId} RETURNING id;
  `;
  return rows.length > 0;
}
