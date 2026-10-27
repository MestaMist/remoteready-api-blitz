-- RemoteReady Database Schema for Neon PostgreSQL
-- Run this in your Neon SQL Editor or let the auto-migration API initialize it.

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Applications Tracker Table
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(128),
  company_name VARCHAR(255) NOT NULL,
  role_title VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Interested', -- 'Interested', 'Applied', 'Interview', 'Offer', 'Rejected'
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

-- Saved Jobs / Bookmarks Table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(128) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  source VARCHAR(64) NOT NULL, -- 'remotive' or 'arbeitnow'
  job_url TEXT NOT NULL,
  location VARCHAR(255),
  salary VARCHAR(128),
  category VARCHAR(128),
  tags JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default_user',
  preferred_currency VARCHAR(10) DEFAULT 'USD',
  preferred_country VARCHAR(10) DEFAULT 'US',
  target_roles JSONB DEFAULT '["Full-Stack Developer", "Frontend Developer", "Backend Developer"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for fast lookups and queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created ON saved_jobs(created_at DESC);
