import { pool } from "./db.js";

const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','supervisor','agent')),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
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

CREATE TABLE IF NOT EXISTS call_logs (
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

CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES users(id),
  due_datetime timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('Due','Done','Missed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(status, due_datetime);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
`;

export async function initDb() {
  console.log("Running DB migrations...");
  await pool.query(schema);
  console.log("DB migrations done");
}
