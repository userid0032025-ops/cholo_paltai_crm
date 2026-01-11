import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const authRouter = Router();

// One-time admin bootstrap endpoint
authRouter.post("/bootstrap-admin", async (req, res) => {
  try {
    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS c FROM users"
    );
    const count = countResult.rows[0]?.c ?? 0;
    if (count > 0) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const schema = z.object({
      name: z.string().min(1),
      phone: z.string().min(6),
      password: z.string().min(4)
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const { name, phone, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      "INSERT INTO users (name, phone, role, password_hash) VALUES ($1,$2,'admin',$3) RETURNING id,name,phone,role",
      [name, phone, passwordHash]
    );

    return res.json({ user: insert.rows[0] });
  } catch (err) {
    console.error("bootstrap-admin error", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// Normal login
authRouter.post("/login", async (req, res) => {
  const schema = z.object({
    phone: z.string().min(6),
    password: z.string().min(4)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { phone, password } = parsed.data;
  const { rows } = await pool.query(
    "SELECT id, name, phone, role, password_hash FROM users WHERE phone=$1",
    [phone]
  );
  const u = rows[0];
  if (!u) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: u.id, role: u.role, name: u.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { id: u.id, name: u.name, phone: u.phone, role: u.role }
  });
});
