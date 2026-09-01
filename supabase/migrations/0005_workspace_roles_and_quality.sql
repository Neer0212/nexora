-- Migration 0005: Workspace Roles and Quality

-- 1. Add 'viewer' role to business_member_role enum
ALTER TYPE public.business_member_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. Add quality_metrics JSONB column to datasets table to store data quality analysis
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS quality_metrics jsonb DEFAULT '{}'::jsonb;
