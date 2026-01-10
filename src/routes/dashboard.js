import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware_auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/kpi", async (req, res) => {
  const mine = (req.query.mine || "0").toString() === "1";
  const userFilter = mine && req.user.role === "agent" ? "AND agent_id = $1" : "";
  const params = mine && req.user.role === "agent" ? [req.user.id] : [];

  const overdue = await pool.query(
    `SELECT COUNT(*)::int AS c
     FROM followups
     WHERE status='Due' AND due_datetime < NOW() ${userFilter}`,
    params
  );

  const today = await pool.query(
    `SELECT COUNT(*)::int AS c
     FROM followups
     WHERE status='Due'
       AND due_datetime >= date_trunc('day', NOW())
       AND due_datetime < date_trunc('day', NOW()) + interval '1 day'
       ${userFilter}`,
    params
  );

  const converted = await pool.query(
    `SELECT COUNT(*)::int AS c
     FROM leads
     WHERE pipeline_status='Converted'`,
    []
  );

  res.json({
    overdue_followups: overdue.rows[0].c,
    today_followups: today.rows[0].c,
    total_converted: converted.rows[0].c
  });
});
