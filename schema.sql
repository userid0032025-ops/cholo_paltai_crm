CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','supervisor','agent')),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text NOT NULL,
  source text NOT NULL,
  course_interest text NOT NULL,
  location text,
  pipeline_status text NOT NULL,
  assigned_agent_id uuid REFERENCES users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE call_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES users(id),
  call_time timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL,
  disposition text NOT NULL,
  notes text,
  followup_datetime timestamptz,
  lost_reason text
);

CREATE TABLE followups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES users(id),
  due_datetime timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('Due','Done','Missed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_followups_due ON followups(status, due_datetime);
CREATE INDEX idx_leads_status ON leads(pipeline_status);
CREATE INDEX idx_leads_phone ON leads(phone);
