import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const authRouter = Router();

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
