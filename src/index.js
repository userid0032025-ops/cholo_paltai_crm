import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { callsRouter } from "./routes/calls.js";
import { followupsRouter } from "./routes/followups.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { initDb } from "./initDb.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send("Cholo-Paltai CRM API OK"));
app.use("/auth", authRouter);
app.use("/leads", leadsRouter);
app.use("/calls", callsRouter);
app.use("/followups", followupsRouter);
app.use("/dashboard", dashboardRouter);

const port = process.env.PORT || 4000;

async function start() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`API listening on ${port}`);
    });
  } catch (err) {
    console.error("Failed to initialize database", err);
    process.exit(1);
  }
}

start();
