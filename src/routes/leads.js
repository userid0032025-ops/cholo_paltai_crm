import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware_auth.js";

export const leadsRouter = Router();
leadsRouter.use(requireAuth);

const LeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  source: z.enum(["Call", "Facebook", "WhatsApp", "Manual"]),
  course_interest: z.string().min(1),
  location: z.string().optional().nullable(),
  pipeline_status: z.enum([
    "New",
    "Contacted",
    "Interested",
    "Info sent",
    "Payment pending",
    "Converted",
    "Lost"
  ]),
  assigned_agent_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable()
});

leadsRouter.get("/", async (req, res) => {
  const q = (req.query.q || "").toString();
  const status = (req.query.status || "").toString();
  const mine = (req.query.mine || "0").toString() === "1";

  const params = [];
  let where = "WHERE 1=1";

  if (q) {
    params.push(`%${q}%`);
    where += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
  }
  if (status) {
    params.push(status);
    where += ` AND pipeline_status = $${params.length}`;
  }
  if (mine && req.user.role === "agent") {
    params.push(req.user.id);
    where += ` AND assigned_agent_id = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT id, name, phone, source, course_interest, location, pipeline_status, assigned_agent_id, created_at
     FROM leads ${where}
     ORDER BY created_at DESC
     LIMIT 200`,
    params
  );
  res.json(rows);
});

leadsRouter.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM leads WHERE id=$1`,
    [req.params.id]
  );
  const lead = rows[0];
  if (!lead) return res.status(404).json({ error: "Not found" });

  const calls = await pool.query(
    `SELECT * FROM call_logs WHERE lead_id=$1 ORDER BY call_time DESC LIMIT 50`,
    [req.params.id]
  );

  res.json({ lead, calls: calls.rows });
});

leadsRouter.post("/", async (req, res) => {
  const parsed = LeadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const d = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO leads (name, phone, source, course_interest, location, pipeline_status, assigned_agent_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      d.name,
      d.phone,
      d.source,
      d.course_interest,
      d.location ?? null,
      d.pipeline_status,
      d.assigned_agent_id ?? null,
      d.notes ?? null
    ]
  );

  res.status(201).json(rows[0]);
});
