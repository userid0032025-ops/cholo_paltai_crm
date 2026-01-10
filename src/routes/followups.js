import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware_auth.js";

export const followupsRouter = Router();
followupsRouter.use(requireAuth);

followupsRouter.get("/mine", async (req, res) => {
  if (req.user.role !== "agent") {
    return res.status(403).json({ error: "Agents only" });
  }
  const { rows } = await pool.query(
    `SELECT f.id, f.lead_id, f.due_datetime, f.status,
            l.name, l.phone, l.course_interest
     FROM followups f
     JOIN leads l ON l.id = f.lead_id
     WHERE f.agent_id = $1 AND f.status = 'Due'
     ORDER BY f.due_datetime ASC
     LIMIT 200`,
    [req.user.id]
  );
  res.json(rows);
});

followupsRouter.post("/:id/complete", async (req, res) => {
  const { rowCount } = await pool.query(
    `UPDATE followups
     SET status='Done'
     WHERE id=$1 AND agent_id=$2`,
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});
