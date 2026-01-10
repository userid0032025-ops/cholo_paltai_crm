import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware_auth.js";

export const callsRouter = Router();
callsRouter.use(requireAuth);

const CallSchema = z.object({
  lead_id: z.string().uuid(),
  outcome: z.enum(["Connected","No answer","Busy","Switched off","Wrong number"]),
  disposition: z.enum(["Interested","Trial booked","Payment pending","Converted","Lost","Call later"]),
  notes: z.string().optional().nullable(),
  followup_datetime: z.string().datetime().optional().nullable(),
  lost_reason: z.string().optional().nullable()
});

callsRouter.post("/", async (req, res) => {
  const parsed = CallSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const d = parsed.data;

  if (!["Converted","Lost"].includes(d.disposition) && !d.followup_datetime) {
    return res.status(400).json({ error: "followup_datetime is required" });
  }
  if (d.disposition === "Lost" && !d.lost_reason) {
    return res.status(400).json({ error: "lost_reason is required" });
  }

  const { rows } = await pool.query(
    `INSERT INTO call_logs (lead_id, agent_id, call_time, outcome, disposition, notes, followup_datetime, lost_reason)
     VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      d.lead_id,
      req.user.id,
      d.outcome,
      d.disposition,
      d.notes ?? null,
      d.followup_datetime ?? null,
      d.lost_reason ?? null
    ]
  );

  const statusMap = {
    "Interested": "Interested",
    "Trial booked": "Interested",
    "Payment pending": "Payment pending",
    "Converted": "Converted",
    "Lost": "Lost",
    "Call later": "Contacted"
  };
  const newStatus = statusMap[d.disposition] ?? "Contacted";

  await pool.query(
    `UPDATE leads SET pipeline_status=$1, updated_at=NOW() WHERE id=$2`,
    [newStatus, d.lead_id]
  );

  if (d.followup_datetime) {
    await pool.query(
      `INSERT INTO followups (lead_id, agent_id, due_datetime, status)
       VALUES ($1,$2,$3,'Due')`,
      [d.lead_id, req.user.id, d.followup_datetime]
    );
  }

  res.status(201).json(rows[0]);
});
