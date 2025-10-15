-- Allow period_end to be nullable for free tier users (lifetime tracking)
ALTER TABLE scan_usage 
ALTER COLUMN period_end DROP NOT NULL;